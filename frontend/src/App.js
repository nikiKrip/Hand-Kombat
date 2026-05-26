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
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  console.log(
    "Fullscreen canvas:",
    canvas.width,
    canvas.height
  );
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
    console.log("Requesting camera access...");
    
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "user"
      },
    });

    video.srcObject = stream;

    // Wait for video metadata to load
    await new Promise((resolve) => {
      video.onloadedmetadata = () => {
        resolve();
      };
    });

    await video.play();

    console.log("✅ Camera started successfully");
    console.log(`Video dimensions: ${video.videoWidth}x${video.videoHeight}`);

    // Start hand tracking after camera is ready
    startHandTracking();
  } catch (err) {
    console.error("❌ Camera error:", err);
    alert("Failed to access camera. Please ensure:\n1. Camera permissions are granted\n2. No other app is using the camera\n3. You're using HTTPS or localhost");
  }
}

// ==========================
// MEDIAPIPE HAND TRACKING
// ==========================

function startHandTracking() {
  runHandTracking(video, (results) => {
    const landmarks = results.multiHandLandmarks || [];

    // Send landmarks to backend AI only if hands detected
    if (landmarks.length > 0) {
      sendFrameData(landmarks);
      
      // Visual feedback in console (optional)
      if (Math.random() < 0.1) { // Log occasionally to avoid spam
        console.log(`👋 Detected ${landmarks.length} hand(s)`);
      }
    }
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

  // Update game state (handles both player and enemy)
  game.update(aiData);

  // Display coaching tip if available
  if (aiData.tip) {
    console.log("Coach Tip:", aiData.tip);
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