"use client";

export default function HeroBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {/* Градиентная сфера */}
      <div
        className="absolute w-[600px] h-[600px] -top-[200px] left-1/2 -translate-x-1/2 rounded-full opacity-40 animate-float"
        style={{
          background:
            "radial-gradient(circle, rgba(34, 197, 94, 0.15) 0%, rgba(15, 23, 42, 0.4) 40%, transparent 70%)",
        }}
      />
      {/* Частицы */}
      <div className="absolute inset-0">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-accent/40 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${4 + (i % 5)}s`,
              animationDelay: `${(i % 10) * 0.2}s`,
            }}
          />
        ))}
      </div>
      {/* Градиентный оверлей */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 0%, rgba(34, 197, 94, 0.08) 0%, transparent 50%), radial-gradient(ellipse 60% 50% at 80% 50%, rgba(34, 197, 94, 0.04) 0%, transparent 50%)",
        }}
      />
    </div>
  );
}
