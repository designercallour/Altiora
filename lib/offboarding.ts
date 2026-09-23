/**
 * Internship Offboarding helpers — status labels, the founder roster, the
 * prep / handover / LinkedIn checklist definition, and the availability window.
 *
 * Offboarding is the terminal exit 1-on-1 (a single 60-minute session near the
 * intern's last day) plus the handover checklist. One record per internship,
 * authored by the supervisor. See the offboarding checklist source document.
 */
import type {
  FounderFeedback,
  Internship,
  OffboardingChecklist,
  OffboardingStatus,
} from "@/types/domain";
import { endsWithinDays, internshipLifecycle } from "@/lib/internship";

export const OFFBOARDING_STATUS_LABELS: Record<OffboardingStatus, string> = {
  not_started: "Not started",
  completed: "Completed",
};

/** The three studio founders whose feedback the intern gives during the exit 1-on-1. */
export const FOUNDERS = ["Panggih", "Dicky", "Alfikri"] as const;

/** A fresh, empty founder-feedback table (one row per founder). */
export function emptyFounderFeedback(): FounderFeedback[] {
  return FOUNDERS.map((founder) => ({ founder, good: null, improve: null }));
}

/**
 * Merge saved founder feedback onto the canonical roster so the table always
 * has exactly one row per current founder, in order — tolerant of added/removed
 * founders or a legacy record.
 */
export function normalizeFounderFeedback(
  saved: FounderFeedback[] | null | undefined,
): FounderFeedback[] {
  const byName = new Map((saved ?? []).map((f) => [f.founder, f]));
  return FOUNDERS.map((founder) => ({
    founder,
    good: byName.get(founder)?.good ?? null,
    improve: byName.get(founder)?.improve ?? null,
  }));
}

export interface ChecklistItem {
  key: string;
  label: string;
}
export interface ChecklistSection {
  title: string;
  items: ChecklistItem[];
}

/** The handover / access / recommendation checklist, grouped by section. */
export const OFFBOARDING_CHECKLIST: ChecklistSection[] = [
  {
    title: "Persiapan sebelum sesi",
    items: [
      {
        key: "prep_invite",
        label:
          "Undangan 60 menit terkirim & intern diminta menyiapkan refleksi + masukan",
      },
      {
        key: "prep_points",
        label:
          "2–3 poin apresiasi & 1–2 area pengembangan spesifik disiapkan",
      },
      { key: "prep_assessment_draft", label: "Draf form penilaian sudah diisi" },
    ],
  },
  {
    title: "Administrasi, akses & serah terima",
    items: [
      {
        key: "handover_work",
        label: "Serah terima pekerjaan berjalan + PIC pengganti",
      },
      {
        key: "files_moved",
        label: "File, dokumen, & catatan kerja dipindah ke folder tim",
      },
      {
        key: "assets_returned",
        label: "Laptop, ID card, & aset kantor lain dikembalikan",
      },
      {
        key: "access_revoked",
        label: "Akses dinonaktifkan setelah serah terima selesai",
      },
      {
        key: "final_assessment_sent",
        label: "Form penilaian final ditandatangani & dikirim ke HR/kampus",
      },
      {
        key: "certificate_processed",
        label: "Sertifikat / surat keterangan magang diproses",
      },
    ],
  },
  {
    title: "Rekomendasi LinkedIn (dua arah)",
    items: [
      {
        key: "linkedin_supervisor_sent",
        label: "Supervisor sudah mengirim rekomendasi",
      },
      {
        key: "linkedin_intern_sent",
        label: "Anak magang sudah mengirim rekomendasi",
      },
    ],
  },
];

export const OFFBOARDING_CHECKLIST_KEYS: string[] =
  OFFBOARDING_CHECKLIST.flatMap((s) => s.items.map((i) => i.key));

/** A fresh checklist with every item unchecked. */
export function defaultChecklist(): OffboardingChecklist {
  return Object.fromEntries(OFFBOARDING_CHECKLIST_KEYS.map((k) => [k, false]));
}

/** Coerce a stored/partial checklist to the full canonical shape. */
export function normalizeChecklist(
  saved: OffboardingChecklist | null | undefined,
): OffboardingChecklist {
  return Object.fromEntries(
    OFFBOARDING_CHECKLIST_KEYS.map((k) => [k, Boolean(saved?.[k])]),
  );
}

/** How many checklist items are done, out of the total. */
export function checklistProgress(cl: OffboardingChecklist): {
  done: number;
  total: number;
} {
  const total = OFFBOARDING_CHECKLIST_KEYS.length;
  const done = OFFBOARDING_CHECKLIST_KEYS.filter((k) => cl?.[k]).length;
  return { done, total };
}

/** Days before the end date that offboarding starts surfacing. */
export const OFFBOARDING_WINDOW_DAYS = 14;

/**
 * Offboarding surfaces only when an internship is wrapping up — within its final
 * `OFFBOARDING_WINDOW_DAYS`, or already completed. Upcoming and early-active
 * internships don't show it, keeping the list focused on who's actually leaving.
 */
export function isOffboardingAvailable(
  internship: Pick<Internship, "startDate" | "endDate">,
  now: Date = new Date(),
): boolean {
  const life = internshipLifecycle(internship, now);
  if (life.phase === "completed") return true;
  return endsWithinDays(internship, OFFBOARDING_WINDOW_DAYS, now);
}
