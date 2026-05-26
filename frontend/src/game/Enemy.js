import idleImg from "../assets/characters/enemy/enemy-idle.png";
import punchImg from "../assets/characters/enemy/enemy-punch.png";
import blockImg from "../assets/characters/enemy/enemy-defend.png";
import deadImg from "../assets/characters/enemy/enemy-dead.png";
import kickImg from "../assets/characters/enemy/enemy-kick.png"

export default class Enemy {
  constructor(ctx) {
    this.ctx = ctx;
    this.health = 100;
    const canvas = this.ctx.canvas;

    this.width = canvas.width * 0.28;
    this.height = canvas.height * 0.55;

    this.x = canvas.width * 0.68;
    this.y = canvas.height - this.height - 40;
    this.state = "idle";
    this.lastAttack = 0;

    this.images = {
      idle: new Image(),
      punch: new Image(),
      block: new Image(),
      dead: new Image(),
      kick: new Image(),
    };

    this.images.idle.src = idleImg;
    this.images.punch.src = punchImg;
    this.images.block.src = blockImg;
    this.images.dead.src = deadImg;
    this.images.kick.src = kickImg;
  }

  perform(action) {
    const now = Date.now();

    if (now - this.lastAttack < 1000) return;

    this.lastAttack = now;
    if (action === "PUNCH") this.state = "punch";
    else if (action == "KICK") this.state = "kick";
    else if (action === "BLOCK") this.state = "block";
    else this.state = "idle";
    if (this.health == 0) this.state = "dead"
  }

  draw() {
    const img = this.images[this.state];
    this.ctx.drawImage(img, this.x, this.y, this.width, this.height);
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health < 0) this.health = 0;
  }
}