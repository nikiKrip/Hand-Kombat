import { Hands } from "@mediapipe/hands";

const hands = new Hands({
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});

hands.setOptions({
  maxNumHands: 2,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.5,
  modelComplexity: 1,
});

export const runHandTracking = (video, callback) => {
  hands.onResults(callback);

  const loop = async () => {
    // Only send frames if video is ready and playing
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      await hands.send({ image: video });
    }
    requestAnimationFrame(loop);
  };
  
  // Start the loop
  loop();
  
  console.log("MediaPipe hand tracking initialized");
};