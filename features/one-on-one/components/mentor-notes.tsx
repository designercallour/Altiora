import type { MonthlyOneOnOne } from "@/types/domain";

const FIELDS: {
  key: "strengths" | "concerns" | "goalsNextMonth";
  emoji: string;
  label: string;
}[] = [
  { key: "strengths", emoji: "💪", label: "Strengths" },
  { key: "concerns", emoji: "💬", label: "Concerns" },
  { key: "goalsNextMonth", emoji: "🎯", label: "Goals for Next Month" },
];

/** Read-only render of a completed 1-on-1's mentor notes (intern + detail views). */
export function MentorNotes({ record }: { record: MonthlyOneOnOne }) {
  return (
    <div className="space-y-4">
      {FIELDS.map((f) => {
        const value = record[f.key];
        return (
          <div
            key={f.key}
            className="border-border bg-card rounded-xl border p-4"
          >
            <h3 className="text-sm font-medium">
              <span aria-hidden>{f.emoji}</span> {f.label}
            </h3>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed whitespace-pre-wrap">
              {value && value.trim() ? value : "—"}
            </p>
          </div>
        );
      })}
    </div>
  );
}
