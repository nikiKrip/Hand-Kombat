import HealthBar from "../UI/HealthBar.js";
import bgImg from "../assets/background/background.png";

export default class GameEngine {
  constructor(ctx, player, enemy) {
    this.ctx = ctx;
    this.player = player;
    this.enemy = enemy;

    this.playerHealthBar = new HealthBar(ctx, 50, 50, 200, 20, 100);
    this.enemyHealthBar = new HealthBar(ctx, 400, 50, 200, 20, 100);

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