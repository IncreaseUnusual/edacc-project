import confetti from "canvas-confetti";

export function fireCorrectConfetti() {
  confetti({
    particleCount: 60,
    spread: 55,
    origin: { y: 0.7 },
    colors: ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b"],
  });
}

export function fireCompletionConfetti() {
  const duration = 2000;
  const end = Date.now() + duration;

  function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b", "#ef4444"],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b", "#ef4444"],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  }

  frame();
}
