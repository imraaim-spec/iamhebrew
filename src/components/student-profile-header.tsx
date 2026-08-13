import Link from "next/link";
import { initialFor } from "@/lib/content-types";

/**
 * Identity block at the top of a student's profile: where you are, who
 * they are, and the three numbers worth knowing before you scroll.
 */
export function StudentProfileHeader({
  fullName,
  email,
  lessonCount,
  accuracyPct,
  activeDrillCount,
  children,
}: {
  fullName: string | null;
  email: string;
  lessonCount: number;
  accuracyPct: number | null;
  activeDrillCount: number;
  /** Slot for the language selector, which sits opposite the identity. */
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5">
      <nav className="text-[13px] text-text-muted">
        <Link href="/teacher/students" className="hover:underline">
          Students
        </Link>
        <span className="px-2 text-text-faint">/</span>
        <span className="font-semibold text-text">{fullName || email}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span
            className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full font-heading text-3xl font-bold text-white"
            style={{
              background:
                "linear-gradient(135deg, var(--accent), var(--accent-2))",
            }}
          >
            {initialFor(fullName, email)}
          </span>
          <div>
            <h1 className="text-2xl">{fullName || email}</h1>
            <p className="text-sm text-text-muted">{email}</p>
            <div className="mt-2 flex flex-wrap gap-5 text-sm">
              <Stat value={lessonCount} label="lessons" />
              <Stat
                value={accuracyPct === null ? "—" : `${accuracyPct}%`}
                label="accuracy"
                emphasis
              />
              <Stat value={activeDrillCount} label="active drills" />
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function Stat({
  value,
  label,
  emphasis = false,
}: {
  value: string | number;
  label: string;
  emphasis?: boolean;
}) {
  return (
    <div>
      <span
        className={`font-heading font-bold tabular-nums ${
          emphasis ? "text-ok" : ""
        }`}
      >
        {value}
      </span>{" "}
      <span className="text-[13px] text-text-muted">{label}</span>
    </div>
  );
}
