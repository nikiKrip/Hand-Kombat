import idleImg from "../assets/characters/player/player-idle.png";
import punchImg from "../assets/characters/player/player-punch.png";
import blockImg from "../assets/characters/player/player-defend.png";
import kickImg from "../assets/characters/player/player-kick.png"
import deadImg from "../assets/characters/player/player-dead.png";

export default class Player {
  constructor(ctx) {
    this.ctx = ctx;
    this.health = 100;
    const canvas = this.ctx.canvas;

    this.width = canvas.width * 0.38;
    this.height = canvas.height * 0.55;

    this.x = canvas.width * 0.05;
    this.y = canvas.height - this.height - 40;
    this.state = "idle";

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
    // Check if dead first
    if (this.health <= 0) {
      this.state = "dead";
      return;
    }
    
    // Set action state
    if (action === "PUNCH") this.state = "punch";
    else if (action === "KICK") this.state = "kick";
    else if (action === "BLOCK" || action === "DEFEND") this.state = "block";
    else this.state = "idle";
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