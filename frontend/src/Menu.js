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
    this.ctx.clearRect(0, 0, 800, 600);

    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, 800, 600);

    this.ctx.fillStyle = "white";
    this.ctx.font = "40px Arial";
    this.ctx.fillText("FIGHT GAME", 250, 150);

    this.options.forEach((opt, index) => {
      this.ctx.fillStyle = index === this.selected ? "yellow" : "white";
      this.ctx.fillText(opt, 300, 250 + index * 60);
    });
  }
}