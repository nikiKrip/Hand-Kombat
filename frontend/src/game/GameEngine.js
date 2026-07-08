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

    // Shared fighting gap — both characters stop this far apart (left edge to left edge)
    this._fightGap = canvas.width * 0.30;

    // Enemy sprite width for right-edge clamping
    this._enemySpriteW = canvas.width * 0.28;

    // Enemy X bounds: can move anywhere right of fightGap from left edge, stays on screen
    this._enemyMinX = canvas.width * 0.30;
    this._enemyMaxX = canvas.width - this._enemySpriteW - 10;

    this.enemy.x = Math.min(canvas.width * 0.65, this._enemyMaxX);
    this.enemy.targetX = this.enemy.x;

    // movement params
    this._enemyMove = {
      targetX: this.enemy.x,
      speed: 3,
      tickMs: 150,
      intervalId: null,
    };
    // start autonomous movement
    this._startEnemyMovement();
  }
  // Clamp a value within the safe enemy X bounds
  _clampEnemyX(x) {
    return Math.max(this._enemyMinX, Math.min(this._enemyMaxX, x));
  }

  // Move enemy one step toward its current targetX; called every tickMs
  _enemyMoveStep() {
    if (this.gameOver) return;
    if (!this.enemy) return;

    const curX = this.enemy.targetX ?? this.enemy.x ?? this._enemyMinX;
    const target = this._clampEnemyX(this._enemyMove.targetX);
    const speed = this._enemyMove.speed;

    const dx = target - curX;
    if (Math.abs(dx) < 1) return;

    this.enemy.targetX = this._clampEnemyX(curX + Math.sign(dx) * Math.min(Math.abs(dx), speed));

    // Keep idle sprite while walking
    if (this.enemy.state !== "punch" && this.enemy.state !== "kick" && this.enemy.state !== "block") {
      this.enemy.state = "idle";
    }
  }

  _startEnemyMovement() {
    if (this._enemyMove.intervalId) {
      clearInterval(this._enemyMove.intervalId);
      this._enemyMove.intervalId = null;
    }
    this._enemyMove.intervalId = setInterval(() => this._enemyMoveStep(), this._enemyMove.tickMs);
  }

  _stopEnemyMovement() {
    if (this._enemyMove.intervalId) {
      clearInterval(this._enemyMove.intervalId);
      this._enemyMove.intervalId = null;
    }
  }

  // Returns true if the two characters are close enough for a hit to land.
  // Uses targetX (logical position) so it matches the movement wall.
  _inRange() {
    const playerX = this.player.targetX ?? this.player.x;
    const enemyX  = this.enemy.targetX  ?? this.enemy.x;
    return (enemyX - playerX) <= this._fightGap * 1.2;
  }

  // Temporarily set a character's state and revert to idle after `ms` ms.
  _flashState(character, state, ms = 600) {
    const who = character === this.player ? "player" : "enemy";
    console.log(`[_flashState] ${who} → ${state}`);
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
      const enemyStep = canvas.width * 0.03;
      const playerX = this.player.targetX ?? this.player.x;
      const enemyX  = this.enemy.targetX  ?? this.enemy.x;

      if (enemyAction === "MOVE_TOWARD") {
        // Advance until exactly at fighting distance — no further
        if (enemyX - playerX > this._fightGap) {
          this._enemyMove.targetX = this._clampEnemyX(enemyX - enemyStep);
        }
      } else if (enemyAction === "MOVE_AWAY") {
        // Retreat — but never past the right screen edge
        this._enemyMove.targetX = this._clampEnemyX(enemyX + enemyStep);
      } else if (enemyAction === "PUNCH" || enemyAction === "KICK") {
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
      console.log(`[GameEngine] playerAction=${playerAction ?? "none"} | enemyAction=${aiData.enemyAction ?? "none"} | playerX=${Math.round(this.player.x)} | inRange=${this._inRange()}`);
      if (playerAction) {
        const step = canvas.width * 0.04; // larger step for targetX — lerp smooths it out
        if (playerAction === "MOVE_FORWARD") {
          // Player can advance until fightGap away from the enemy (left edge to left edge)
          const enemyX = this.enemy.targetX ?? this.enemy.x;
          const maxPlayerX = enemyX - this._fightGap;
          this.player.targetX = Math.min((this.player.targetX ?? this.player.x) + step, maxPlayerX);
          this.player.state = "idle";
          console.log(`[GameEngine] MOVE_FORWARD → targetX=${Math.round(this.player.targetX)} (wall at ${Math.round(maxPlayerX)})`);
        } else if (playerAction === "MOVE_BACK") {
          this.player.targetX = Math.max((this.player.targetX ?? this.player.x) - step, 0);
          this.player.state = "idle";
          console.log(`[GameEngine] MOVE_BACK → targetX=${Math.round(this.player.targetX)}`);
        } else if (playerAction === "DEFEND") {
          this._flashState(this.player, "block", 800);
          console.log("[GameEngine] Player DEFEND");
        } else if (playerAction === "PUNCH" || playerAction === "KICK") {
          const now = Date.now();
          const cooldownOk = now - (this._lastPlayerHit || 0) >= 500;
          const inRange = this._inRange();
          const blocked = this.enemy.state === "block";
          console.log(`[GameEngine] Player ${playerAction} — cooldownOk=${cooldownOk} | inRange=${inRange} | enemyBlocked=${blocked}`);
          if (cooldownOk) {
            this._flashState(this.player, playerAction === "PUNCH" ? "punch" : "kick");
            if (!blocked && inRange) {
              this.enemy.takeDamage(playerAction === "PUNCH" ? 10 : 15);
              this._lastPlayerHit = now;
              console.log(`[GameEngine] HIT! Enemy health=${this.enemy.health}`);
            } else if (!inRange) {
              console.warn("[GameEngine] Attack missed — enemy out of range");
            } else {
              console.warn("[GameEngine] Attack blocked by enemy");
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
    this.player.targetX = this.player.x;
    this.enemy.x = this._clampEnemyX(this.ctx.canvas.width * 0.65);
    this.enemy.targetX = this.enemy.x;
    this._enemyMove.targetX = this.enemy.x;
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

    // Lerp player and enemy toward their target positions (smooth movement)
    const LERP = 0.12;
    if (this.player.targetX !== undefined) {
      this.player.x += (this.player.targetX - this.player.x) * LERP;
    }
    if (this.enemy.targetX !== undefined) {
      this.enemy.x += (this.enemy.targetX - this.enemy.x) * LERP;
    }

    this.ctx.drawImage(this.background, 0, 0, canvas.width, canvas.height);

    this.player.draw();
    this.enemy.draw();

    this.playerHealthBar.draw(this.player.health);
    this.enemyHealthBar.draw(this.enemy.health);
  }
}