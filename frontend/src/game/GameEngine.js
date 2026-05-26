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
    // AI action
    this.enemy.perform(aiData.enemyAction);

    // Example damage logic
    if (aiData.enemyAction === "punch" || aiData.enemyAction == "kick" ) {
      this.player.takeDamage(10);
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