// backend/src/socket.js
import WebSocket, { WebSocketServer } from "ws";
import axios from "axios";

const wss = new WebSocketServer({ port: 5050 });

wss.on("connection", (ws) => {
  console.log("[WS] Client connected");

  ws.on("message", async (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (err) {
      console.error("[WS] Failed to parse message:", err);
      return;
    }

    const handCount = Array.isArray(data.landmarks) ? data.landmarks.length : 0;
    console.log(`[WS] Frame received — ${handCount} hand(s)`);

    try {
      const aiResponse = await axios.post("http://localhost:8000/process", data);
      console.log(`[AI] Response — playerAction=${aiResponse.data.playerAction} | enemyAction=${aiResponse.data.enemyAction}`);
      ws.send(JSON.stringify(aiResponse.data));
    } catch (err) {
      console.error("[AI] Request to ai-service failed:", err.message);
    }
  });

  ws.on("close", () => console.log("[WS] Client disconnected"));
});
console.log(
  "WebSocket server running on 5050"
);