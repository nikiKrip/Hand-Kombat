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
} from "./game/gesture/handtracking.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

window.addEventListener("error", (event) => {
  console.error("Global error:", event.error || event.message, event.filename, event.lineno);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled rejection:", event.reason);
});

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
  game.startMatch();
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

const overlay = document.createElement("canvas");
overlay.style.position = "fixed";
overlay.style.top = video.style.top;
overlay.style.right = video.style.right;
overlay.style.width = video.style.width;
overlay.style.height = video.style.height;
overlay.style.pointerEvents = "none";
overlay.style.zIndex = "1001";
overlay.style.borderRadius = "12px";
document.body.appendChild(overlay);
document.body.appendChild(video);

let lastLandmarks = []; // array of hands (each is 21 landmarks)
let overlayCtx = overlay.getContext("2d");

function syncOverlaySize() {
  const vw = video.clientWidth;
  const vh = video.clientHeight;
  overlay.width = vw * devicePixelRatio;
  overlay.height = vh * devicePixelRatio;
  overlay.style.width = `${vw}px`;
  overlay.style.height = `${vh}px`;
  overlayCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}
video.addEventListener("loadedmetadata", syncOverlaySize);
window.addEventListener("resize", syncOverlaySize);

// Gesture detection — mirrors server-side gesture_node exactly.
// Uses scale-invariant per-finger extension test:
//   a finger is "extended" if its tip is farther from the wrist than its MCP.
//
//   Open hand (>=3 fingers extended)      -> MOVE_FORWARD
//   Index only extended, others folded    -> KICK  (any orientation)
//   All fingers folded, fist sideways     -> PUNCH
//   All fingers folded, any other angle   -> MOVE_BACK
//   Both hands open                       -> DEFEND (checked in drawOverlay)
function detectHandGesture(landmarks) {
  if (!landmarks || landmarks.length === 0) return "IDLE";
  const wrist = landmarks[0];
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // tip farther from wrist than MCP => finger is extended
  const extended = (mcp, tip) => dist(landmarks[tip], wrist) > dist(landmarks[mcp], wrist);

  const indexUp  = extended(5,  8);
  const middleUp = extended(9,  12);
  const ringUp   = extended(13, 16);
  const pinkyUp  = extended(17, 20);
  const extCount = [indexUp, middleUp, ringUp, pinkyUp].filter(Boolean).length;

  // Open hand: 3 or 4 fingers extended
  if (extCount >= 3) return "MOVE_FORWARD";

  // KICK: only index extended
  if (indexUp && !middleUp && !ringUp && !pinkyUp) return "KICK";

  // Remaining gestures need a full fist (0 fingers extended)
  if (extCount > 0) return "IDLE";

  // PUNCH: fist held sideways — wrist->MCP9 vector >50° from vertical
  const mcp9 = landmarks[9];
  const dx = mcp9.x - wrist.x;
  const dy = mcp9.y - wrist.y;
  const angleFromVertical = Math.atan2(Math.abs(dx), Math.abs(dy)) * 180 / Math.PI;
  if (angleFromVertical > 50) return "PUNCH";

  // Default closed fist
  return "MOVE_BACK";
}

// draw overlay markers for each detected hand
const GESTURE_COLORS = {
  MOVE_FORWARD: "lime",
  MOVE_BACK: "yellow",
  PUNCH: "red",
  KICK: "orange",
  DEFEND: "cyan",
  IDLE: "#aaaaaa",
};

function drawOverlay(hands) {
  overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
  if (!hands || hands.length === 0) return;
  const vw = video.clientWidth;
  const vh = video.clientHeight;

  // Check DEFEND: both hands detected and both open
  const gestures = hands.map(lm => detectHandGesture(lm));
  const isDefend = hands.length >= 2 && gestures.every(g => g === "MOVE_FORWARD");
  const displayGestures = isDefend ? gestures.map(() => "DEFEND") : gestures;

  for (let i = 0; i < hands.length; i++) {
    const lm = hands[i];
    const wrist = lm[0];
    const x = wrist.x * vw;
    const y = wrist.y * vh;
    const gesture = displayGestures[i];

    overlayCtx.beginPath();
    overlayCtx.fillStyle = GESTURE_COLORS[gesture] ?? "white";
    overlayCtx.strokeStyle = "white";
    overlayCtx.lineWidth = 2;
    overlayCtx.arc(x, y, 8, 0, Math.PI * 2);
    overlayCtx.fill();
    overlayCtx.stroke();

    overlayCtx.font = "12px Arial";
    overlayCtx.fillStyle = "white";
    overlayCtx.fillText(gesture, x + 12, y + 4);
  }
}



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
    syncOverlaySize();

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
    // Send all detected hands (up to 2) so the server can detect DEFEND (both open)
    const hands = (results.multiHandLandmarks || []).slice(0, 2);

    lastLandmarks = hands;
    // Logging the gestures
    if (hands.length === 0) {
      console.debug("[Gesture] No hands detected in this frame");
    } else {
      const gestures = hands.map((lm, i) => {
        const g = detectHandGesture(lm);
        return `hand${i + 1}=${g}`;
      });
      console.log(`[Gesture] Detected: ${gestures.join(", ")}`);
    }

    drawOverlay(hands);

    if (hands.length > 0) {
      sendFrameData(hands);
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

  console.log(
    `[AI] playerAction=${aiData.playerAction ?? "none"} | enemyAction=${aiData.enemyAction ?? "none"}`,
    aiData
  );

  // Only process game actions once the match has actually started
  if (!gameRunning) {
    console.debug("[Game] Message received but game not running yet — ignoring");
    return;
  }

  // Attach latest local landmarks for contact checks in GameEngine
  aiData.clientLandmarks = lastLandmarks;

  // Update game state (handles both player and enemy)
  try {
    game.update(aiData);
  } catch (err) {
    console.error("[Game] update failed:", err, aiData);
  }

  if (aiData.tip && aiData.tip !== socket._lastTip) {
    socket._lastTip = aiData.tip;
    console.log("[Coach]", aiData.tip);
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
    try {
    game.render();
  } catch (err) {
    console.error("Game render failed:", err);
  }
  }

  requestAnimationFrame(loop);
}

// ==========================
// START EVERYTHING
// ==========================

setupCamera();

loop();