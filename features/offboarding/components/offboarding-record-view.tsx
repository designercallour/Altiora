import { Check, Minus } from "lucide-react";
import { formatDate } from "@/lib/format";
import {
  OFFBOARDING_CHECKLIST,
  normalizeChecklist,
  normalizeFounderFeedback,
} from "@/lib/offboarding";
import { cn } from "@/lib/utils";
import type { InternshipOffboarding } from "@/types/domain";

function Block({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </p>
      <p className="text-sm whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold">{children}</h3>;
}

const RECOMMEND_LABEL: Record<string, string> = {
  true: "Ya, merekomendasikan",
  false: "Tidak",
};

/** Read-only render of a completed offboarding record. */
export function OffboardingRecordView({
  record,
}: {
  record: InternshipOffboarding;
}) {
  const founders = normalizeFounderFeedback(record.founderFeedback);
  const checklist = normalizeChecklist(record.checklist);

  return (
    <div className="space-y-10">
      {(record.sessionDate || record.lastDay) && (
        <div className="text-muted-foreground flex flex-wrap gap-x-8 gap-y-1 text-sm">
          {record.sessionDate && (
            <span>Sesi 1-on-1: {formatDate(record.sessionDate)}</span>
          )}
          {record.lastDay && (
            <span>Hari terakhir: {formatDate(record.lastDay)}</span>
          )}
        </div>
      )}

      {(record.reflectionAchievement ||
        record.reflectionChallenge ||
        record.reflectionSkill) && (
        <section className="space-y-4">
          <SectionTitle>Refleksi</SectionTitle>
          <Block
            label="Pencapaian yang dibanggakan"
            value={record.reflectionAchievement}
          />
          <Block
            label="Tantangan terbesar & solusinya"
            value={record.reflectionChallenge}
          />
          <Block
            label="Skill yang paling berkembang"
            value={record.reflectionSkill}
          />
        </section>
      )}

      {record.supervisorFeedback && (
        <section className="space-y-4">
          <SectionTitle>Feedback supervisor untuk kamu</SectionTitle>
          <Block label="Feedback supervisor" value={record.supervisorFeedback} />
        </section>
      )}

      {(record.feedbackForSupervisor ||
        founders.some((f) => f.good || f.improve) ||
        record.feedbackForTeam ||
        record.feedbackForStudio ||
        record.wouldRecommend != null) && (
      <section className="space-y-4">
        <SectionTitle>Feedback kamu</SectionTitle>
        <Block label="Untuk supervisor" value={record.feedbackForSupervisor} />
        {founders.some((f) => f.good || f.improve) && (
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Untuk founder
            </p>
            <div className="space-y-3">
              {founders
                .filter((f) => f.good || f.improve)
                .map((f) => (
                  <div
                    key={f.founder}
                    className="border-border bg-muted/30 space-y-2 rounded-xl border p-4"
                  >
                    <p className="text-sm font-medium">{f.founder}</p>
                    {f.good && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">
                          Sudah baik:{" "}
                        </span>
                        {f.good}
                      </p>
                    )}
                    {f.improve && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">
                          Bisa ditingkatkan:{" "}
                        </span>
                        {f.improve}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
        <Block label="Untuk tim" value={record.feedbackForTeam} />
        <Block label="Untuk studio" value={record.feedbackForStudio} />
        {record.wouldRecommend != null && (
          <Block
            label="Merekomendasikan studio?"
            value={RECOMMEND_LABEL[String(record.wouldRecommend)]}
          />
        )}
      </section>
      )}

      {record.careerPlan && (
        <section className="space-y-4">
          <SectionTitle>Karier</SectionTitle>
          <Block label="Rencana setelah magang" value={record.careerPlan} />
        </section>
      )}

      <section className="space-y-4">
        <SectionTitle>Checklist</SectionTitle>
        {OFFBOARDING_CHECKLIST.map((sec) => (
          <div key={sec.title} className="space-y-2">
            <p className="text-sm font-medium">{sec.title}</p>
            <ul className="space-y-1.5">
              {sec.items.map((item) => {
                const done = Boolean(checklist[item.key]);
                return (
                  <li
                    key={item.key}
                    className="flex items-start gap-2 text-sm"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[5px] border",
                        done
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input text-muted-foreground",
                      )}
                    >
                      {done ? (
                        <Check className="size-3" />
                      ) : (
                        <Minus className="size-3" />
                      )}
                    </span>
                    <span
                      className={cn(!done && "text-muted-foreground")}
                    >
                      {item.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>

      {(record.notesKeyPoints || record.notesFollowUp) && (
        <section className="space-y-4">
          <SectionTitle>Catatan</SectionTitle>
          <Block label="Poin penting" value={record.notesKeyPoints} />
          <Block label="Tindak lanjut & PIC" value={record.notesFollowUp} />
        </section>
      )}
    </div>
  );
}
