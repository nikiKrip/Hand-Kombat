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
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Scale font sizes based on canvas size
    const titleFontSize = Math.floor(canvas.width / 20);
    const optionFontSize = Math.floor(canvas.width / 25);

    this.ctx.fillStyle = "white";
    this.ctx.font = `${titleFontSize}px Arial`;
    this.ctx.textAlign = "center";
    this.ctx.fillText("FIGHT GAME", canvas.width / 2, canvas.height / 4);

    this.ctx.font = `${optionFontSize}px Arial`;
    
    this.options.forEach((opt, index) => {
      const x = canvas.width / 2;
      const y = canvas.height / 2 + index * (optionFontSize + 30);
      
      // Draw border around selected option
      if (index === this.selected) {
        this.ctx.fillStyle = "yellow";
        
        // Measure text width for border
        const textMetrics = this.ctx.measureText(opt);
        const textWidth = textMetrics.width;
        const textHeight = optionFontSize;
        
        // Draw border rectangle
        this.ctx.strokeStyle = "yellow";
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(
          x - textWidth / 2 - 15,
          y - textHeight + 5,
          textWidth + 30,
          textHeight + 10
        );
      } else {
        this.ctx.fillStyle = "white";
      }
      
      this.ctx.fillText(opt, x, y);
    });
    
    // Reset text alignment
    this.ctx.textAlign = "left";
  }
}