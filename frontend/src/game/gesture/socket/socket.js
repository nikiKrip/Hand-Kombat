const socket = new WebSocket("ws://localhost:5050");
export const sendFrameData = (landmarks) => {
  if (socket.readyState === WebSocket.OPEN) {
    console.log(`[WS] Sending frame — ${landmarks.length} hand(s) detected`);
    socket.send(JSON.stringify({ landmarks }));
  } else {
    console.warn(`[WS] Socket not open (state: ${socket.readyState}) — frame dropped`);
  }
};
export default socket;