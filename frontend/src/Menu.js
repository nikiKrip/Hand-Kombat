export default class Menu {
  constructor(canvas, startGameCallback) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.startGame = startGameCallback;

    this.options = ["Play Game", "Settings", "Quit"];
    this.selected = 0;

    this.handleInput();
  }

  handleInput() {
    globalThis.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp") {
        this.selected = (this.selected - 1 + this.options.length) % this.options.length;
      }

      if (e.key === "ArrowDown") {
        this.selected = (this.selected + 1) % this.options.length;
      }

      if (e.key === "Enter") {
        this.selectOption();
      }
    });
  }

  selectOption() {
    const option = this.options[this.selected];

    if (option === "Play Game") {
      this.startGame();
    }

    if (option === "Quit") {
      window.close();
    }
    if (option === "Settings") {
     console.log("Open settings menu");
   }
  }

  render() {
  const canvas = this.ctx.canvas;

  // Clear previous frame
  this.ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Font sizes
  const titleFontSize = Math.floor(canvas.width / 20);
  const optionFontSize = Math.floor(canvas.width / 25);

  // Title
  this.ctx.fillStyle = "red";
  this.ctx.font = `${titleFontSize}px Arial`;
  this.ctx.textAlign = "center";
  this.ctx.fillText("HAND KOMBAT", canvas.width / 2, canvas.height / 4);

  // Menu options
  this.ctx.font = `${optionFontSize}px Arial`;

  this.options.forEach((opt, index) => {
    const x = canvas.width / 2;
    const y = canvas.height / 2 + index * (optionFontSize + 30);

    // Default text color
    this.ctx.fillStyle = "black";

    // Highlight selected option
    if (index === this.selected) {
      const textMetrics = this.ctx.measureText(opt);
      const textWidth = textMetrics.width;
      const textHeight = optionFontSize;

      // Selected text color
      this.ctx.fillStyle = "red";
    }

    // Draw text
    this.ctx.fillText(opt, x, y);
  });

  this.ctx.textAlign = "left";
}
}