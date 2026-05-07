const socket = new WebSocket("ws://localhost:5000"); 
export const sendFrameData = (
  landmarks
) => {
  if (
    socket.readyState === WebSocket.OPEN
  ) {
    socket.send(
      JSON.stringify({ landmarks })
    );
  }
};
export default socket;