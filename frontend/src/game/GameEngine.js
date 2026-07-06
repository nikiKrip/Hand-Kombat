import HealthBar from "../UI/HealthBar.js";
import bgImg from "../assets/background/background.png";

export default class GameEngine {
  constructor(ctx, player, enemy) {
    this.ctx = ctx;
    this.player = player;
    this.enemy = enemy;
    this.gameOver = false;

    const canvas = ctx.canvas;

    const barWidth = canvas.width * 0.25;
    const barHeight = canvas.height * 0.035;

    const topOffset = canvas.height * 0.05;

    // Player bar (left side)
    this.playerHealthBar = new HealthBar(
     ctx,
     canvas.width * 0.08,
     topOffset,
     barWidth,
     barHeight,
     100
    );

    // Enemy bar (right side)
    this.enemyHealthBar = new HealthBar(
     ctx,
     canvas.width - barWidth - canvas.width * 0.08,
     topOffset,
     barWidth,
     barHeight,
     100
    );

    // ADD BACKGROUND
    this.background = new Image();
    this.background.src = bgImg;

    // Robotic enemy movement
    this.enemy.x = this.enemy.x ?? canvas.width * 0.75;
    // movement bounds (enemy will roam between these X positions)
    this._enemyMinX = canvas.width * 0.6;
    this._enemyMaxX = canvas.width * 0.9;

    // movement params
    this._enemyMove = {
      targetX: this.enemy.x,
      speed: 2, // px per tick (will be randomized)
      tickMs: 150,
      intervalId: null,
    };
    // start autonomous movement
    this._startEnemyMovement();
  }
  // pick a new random target within bounds and random speed
  _pickEnemyTarget() {
    const min = this._enemyMinX;
    const max = this._enemyMaxX;
    const range = max - min;
    this._enemyMove.targetX = min + Math.random() * range;
    // random speed between 1 and 4 px per tick
    this._enemyMove.speed = 1 + Math.random() * 3;
  }

  // move enemy a step toward target; called periodically
  _enemyMoveStep() {
    if (this.gameOver) return;
    if (!this.enemy) return;

    const curX = this.enemy.x ?? (this.ctx.canvas.width * 0.75);
    const target = this._enemyMove.targetX;
    const speed = this._enemyMove.speed;

    const dx = target - curX;
    if (Math.abs(dx) < 1) {
      // reached target: pause briefly then pick new
      this._pickEnemyTarget();
      return;
    }

    const step = Math.sign(dx) * Math.min(Math.abs(dx), speed);
    this.enemy.x = curX + step;

    // Keep idle sprite while walking (no walk animation exists)
    if (this.enemy.state !== "punch" && this.enemy.state !== "kick" && this.enemy.state !== "block") {
      this.enemy.state = "idle";
    }
  }

   _startEnemyMovement() {
    // clear existing if any
    if (this._enemyMove.intervalId) {
      clearInterval(this._enemyMove.intervalId);
      this._enemyMove.intervalId = null;
    }
    this._pickEnemyTarget();
    this._enemyMove.intervalId = setInterval(() => this._enemyMoveStep(), this._enemyMove.tickMs);
  }

  _stopEnemyMovement() {
    if (this._enemyMove.intervalId) {
      clearInterval(this._enemyMove.intervalId);
      this._enemyMove.intervalId = null;
    }
  }

  // Returns true if the two characters are close enough for a hit to land.
  // Uses sprite centre-X positions rather than hand landmarks.
  _inRange() {
    const canvas = this.ctx.canvas;
    return Math.abs(this.player.x - this.enemy.x) < canvas.width * 0.35;
  }

  // Temporarily set a character's state and revert to idle after `ms` ms.
  _flashState(character, state, ms = 600) {
    character.state = state;
    setTimeout(() => {
      if (character.state === state) character.state = "idle";
    }, ms);
  }

  update(aiData) {
    if (!aiData) {
      console.warn("GameEngine.update called without aiData");
      return;
    }

    if (this.gameOver) return;

    const canvas = this.ctx.canvas;
    this.player.x = this.player.x ?? canvas.width * 0.25;
    this.enemy.x = this.enemy.x ?? canvas.width * 0.75;

    try {
      // --- Enemy action ---
      const enemyAction = aiData.enemyAction;
      if (enemyAction === "PUNCH" || enemyAction === "KICK") {
        // Only deal damage once per distinct attack (guard with lastAttack timestamp)
        const now = Date.now();
        if (now - (this._lastEnemyHit || 0) >= 1000) {
          this._flashState(this.enemy, enemyAction === "PUNCH" ? "punch" : "kick");
          if (this.player.state !== "block" && this._inRange()) {
            this.player.takeDamage(enemyAction === "PUNCH" ? 10 : 15);
            this._lastEnemyHit = now;
          }
        }
      } else if (enemyAction === "BLOCK") {
        this._flashState(this.enemy, "block", 800);
      }

      // --- Player action ---
      const playerAction = aiData.playerAction;
      if (playerAction) {
        const step = canvas.width * 0.015;
        if (playerAction === "MOVE_FORWARD") {
          this.player.x = Math.min(this.player.x + step, canvas.width * 0.6);
          this.player.state = "idle";
        } else if (playerAction === "MOVE_BACK") {
          this.player.x = Math.max(this.player.x - step, 0);
          this.player.state = "idle";
        } else if (playerAction === "DEFEND") {
          this._flashState(this.player, "block", 800);
        } else if (playerAction === "PUNCH" || playerAction === "KICK") {
          const now = Date.now();
          if (now - (this._lastPlayerHit || 0) >= 500) {
            this._flashState(this.player, playerAction === "PUNCH" ? "punch" : "kick");
            if (this.enemy.state !== "block" && this._inRange()) {
              this.enemy.takeDamage(playerAction === "PUNCH" ? 10 : 15);
              this._lastPlayerHit = now;
            }
          }
        }
      }
    } catch (err) {
      console.error("GameEngine.update error:", err);
    }

    this.checkGameOver();
  }
  resetPlayers() {
    this.gameOver = false;
    this._lastEnemyHit = 0;
    this._lastPlayerHit = 0;

    this.player.health = 100;
    this.enemy.health = 100;

    this.player.state = "idle";
    this.enemy.state = "idle";
    this.player.x = this.ctx.canvas.width * 0.25;
    this.enemy.x = this.ctx.canvas.width * 0.75;
    this._startEnemyMovement();
  }
  checkGameOver() {
    if (this.player.health <= 0 || this.enemy.health <= 0) {
      this.gameOver = true;
      this._stopEnemyMovement();
      if (this.player.health <= 0) this.player.state = "dead";
      if (this.enemy.health <= 0) this.enemy.state = "dead";
    }
  }
  startMatch() {
    this.resetPlayers();
  }
  render() {
    const canvas = this.ctx.canvas;
    this.ctx.drawImage(this.background, 0, 0, canvas.width, canvas.height);

    this.player.draw();
    this.enemy.draw();

    this.playerHealthBar.draw(this.player.health);
    this.enemyHealthBar.draw(this.enemy.health);
  }
}