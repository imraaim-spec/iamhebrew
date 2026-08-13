const PATTERNS = [
  "menorah",
  "candles",
  "torah",
  "pomegranate",
  "olive",
  "palm",
  "cactus",
];

/**
 * The tiled illustration wash behind the student wall. Purely decorative,
 * so it is hidden from assistive tech and never intercepts clicks.
 *
 * Tiles are generated deterministically rather than randomly — a random
 * layout would differ between the server and client render and trip
 * hydration.
 */
export function PatternBackdrop({ count = 60 }: { count?: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="flex flex-wrap content-start gap-1 opacity-[0.14] blur-[1px] -translate-x-8 -translate-y-8">
        {Array.from({ length: count }, (_, i) => {
          const name = PATTERNS[i % PATTERNS.length];
          // Deterministic pseudo-jitter so the grid doesn't read as a grid.
          const rotate = ((i * 37) % 31) - 15;
          const scale = 0.88 + ((i * 13) % 25) / 100;
          return (
            <img
              key={i}
              src={`/patterns/${name}.webp`}
              alt=""
              width={92}
              height={92}
              className="h-[92px] w-[92px] shrink-0 object-contain"
              style={{ transform: `rotate(${rotate}deg) scale(${scale})` }}
            />
          );
        })}
      </div>
    </div>
  );
}
