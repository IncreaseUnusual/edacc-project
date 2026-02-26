"use client";

const bees = [
  { className: "animate-float-bee-1", style: { top: "12%", left: "8%", animationDelay: "0s" } },
  { className: "animate-float-bee-2", style: { top: "25%", right: "6%", animationDelay: "2s" } },
  { className: "animate-float-bee-3", style: { bottom: "30%", left: "12%", animationDelay: "4s" } },
  { className: "animate-float-bee-1", style: { bottom: "18%", right: "10%", animationDelay: "1s" } },
  { className: "animate-float-bee-2", style: { top: "50%", left: "4%", animationDelay: "3s" } },
];

export function FloatingBees() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {bees.map((bee, i) => (
        <span
          key={i}
          className={`absolute text-xl opacity-20 select-none ${bee.className}`}
          style={bee.style}
        >
          🐝
        </span>
      ))}
    </div>
  );
}
