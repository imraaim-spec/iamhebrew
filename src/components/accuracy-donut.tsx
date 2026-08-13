/**
 * Overall accuracy as a ring. The track is always a full circle so an
 * empty result still reads as "nothing yet" rather than a broken graphic.
 */
export function AccuracyDonut({
  pct,
  size = 64,
  stroke = 7,
}: {
  pct: number | null;
  size?: number;
  stroke?: number;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = pct === null ? 0 : (pct / 100) * circumference;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={
        pct === null ? "No accuracy recorded yet" : `${pct} percent accuracy`
      }
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-alt)"
          strokeWidth={stroke}
        />
        {pct !== null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--ok)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference}`}
          />
        )}
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-heading text-[15px] font-bold tabular-nums">
        {pct === null ? "—" : `${pct}%`}
      </span>
    </div>
  );
}
