import { Hands } from "@mediapipe/hands";

const hands = new Hands({
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});

hands.setOptions({
  maxNumHands: 2,
  minDetectionConfidence: 0.7,
});

export const runHandTracking = (video, callback) => {
  hands.onResults(callback);

  const loop = async () => {
    await hands.send({ image: video });
    requestAnimationFrame(loop);
  };
  loop();
};