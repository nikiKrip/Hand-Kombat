// frontend/src/App.js

import Menu from "./Menu.js";
import GameEngine from "./game/GameEngine.js";
import Player from "./game/Player.js";
import Enemy from "./game/Enemy.js";

import socket, {
  sendFrameData,
} from "./game/gesture/socket/socket.js";

import {
  runHandTracking,
} from "./game/gesture/handTracking.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Set canvas to fit screen while maintaining aspect ratio
function resizeCanvas() {
  const aspectRatio = 4 / 3; // 800:600 ratio
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  let canvasWidth = windowWidth;
  let canvasHeight = windowWidth / aspectRatio;
  
  if (canvasHeight > windowHeight) {
    canvasHeight = windowHeight;
    canvasWidth = windowHeight * aspectRatio;
  }
  
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let gameRunning = false;

const startGame = () => {
  gameRunning = true;
};

const menu = new Menu(canvas, startGame);

const player = new Player(ctx);
const enemy = new Enemy(ctx);

const game = new GameEngine(
  ctx,
  player,
  enemy
);

// ==========================
// WEBCAM SETUP
// ==========================

const video = document.createElement("video");

video.autoplay = true;
video.playsInline = true;

// Camera preview styles
video.style.position = "fixed";
video.style.top = "20px";
video.style.right = "20px";

video.style.width = "220px";
video.style.height = "160px";

video.style.border = "3px solid white";
video.style.borderRadius = "12px";

video.style.objectFit = "cover";
video.style.zIndex = "1000";

// Hit Esc Button to return to main menu
globalThis.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    gameRunning = false;
  }
});
document.body.appendChild(video);

async function setupCamera() {
  try {
    const stream =
      await navigator.mediaDevices.getUserMedia({
        video: true,
      });

    video.srcObject = stream;

    await video.play();

    console.log("Camera started");

    startHandTracking();
  } catch (err) {
    console.error("Camera error:", err);
  }
}

// ==========================
// MEDIAPIPE HAND TRACKING
// ==========================

function startHandTracking() {
  runHandTracking(video, (results) => {
    const landmarks =
      results.multiHandLandmarks || [];

    // Send landmarks to backend AI
    sendFrameData(landmarks);

    // OPTIONAL:
    // visualize landmarks in console
    // console.log(landmarks);
  });
}

// ==========================
// SOCKET AI RESPONSE
// ==========================

socket.onopen = () => {
  console.log("Connected to WebSocket server");
};

socket.onmessage = (event) => {
  const aiData = JSON.parse(event.data);

  console.log("AI Response:", aiData);

  // Update game state
  game.update(aiData);

  // OPTIONAL:
  // update player animation too
  if (aiData.playerAction) {
    player.perform(aiData.playerAction);
  }
};

socket.onerror = (err) => {
  console.error("Socket error:", err);
};

socket.onclose = () => {
  console.log("Socket disconnected");
};

// ==========================
// GAME LOOP
// ==========================

function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!gameRunning) {
    menu.render();
  } else {
    game.render();
  }

  requestAnimationFrame(loop);
}

// ==========================
// START EVERYTHING
// ==========================

setupCamera();

loop();