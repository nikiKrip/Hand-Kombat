// backend/src/socket.js
import WebSocket, { WebSocketServer } from "ws";
import axios from "axios";

const wss = new WebSocketServer({ port: 5050 });

wss.on("connection", (ws) => {
  ws.on("message", async (message) => {
    const data = JSON.parse(message);

    const aiResponse = await axios.post(
      "http://localhost:8000/process",
      data
    );

    ws.send(JSON.stringify(aiResponse.data));
  });
});
console.log(
  "WebSocket server running on 5050"
);