export default class HealthBar {
  constructor(ctx, x, y, width, height, maxHealth) {
    this.ctx = ctx;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.maxHealth = maxHealth;
  }

  draw(currentHealth) {
    const healthPercent = currentHealth / this.maxHealth;

    // Background (gray)
    this.ctx.fillStyle = "gray";
    this.ctx.fillRect(this.x, this.y, this.width, this.height);

    // Health (green)
    this.ctx.fillStyle = "green";
    this.ctx.fillRect(
      this.x,
      this.y,
      this.width * healthPercent,
      this.height
    );

    // Border
    this.ctx.strokeStyle = "black";
    this.ctx.strokeRect(this.x, this.y, this.width, this.height);
  }
}