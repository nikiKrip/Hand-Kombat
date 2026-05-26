import HealthBar from "../UI/HealthBar.js";
import bgImg from "../assets/background/background.png";

export default class GameEngine {
  constructor(ctx, player, enemy) {
    this.ctx = ctx;
    this.player = player;
    this.enemy = enemy;

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
  }

  update(aiData) {
    // Update enemy action
    if (aiData.enemyAction) {
      this.enemy.perform(aiData.enemyAction);
    }

    // Update player action
    if (aiData.playerAction) {
      this.player.perform(aiData.playerAction);
    }

    // Damage logic: Enemy attacks player
    if (aiData.enemyAction === "PUNCH") {
      // Player takes damage unless blocking
      if (this.player.state !== "block") {
        this.player.takeDamage(10);
      }
    } else if (aiData.enemyAction === "KICK") {
      // Kick does more damage
      if (this.player.state !== "block") {
        this.player.takeDamage(15);
      }
    }

    // Damage logic: Player attacks enemy
    if (aiData.playerAction === "PUNCH") {
      // Enemy takes damage unless blocking
      if (this.enemy.state !== "block") {
        this.enemy.takeDamage(10);
      }
    } else if (aiData.playerAction === "KICK") {
      // Kick does more damage
      if (this.enemy.state !== "block") {
        this.enemy.takeDamage(15);
      }
    }
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