import { z } from "zod";
import type {
  LearningImportance,
  LearningIntelligence,
  LearningStatus,
} from "@/types/domain";

const LEARNING_STATUS = [
  "New Learning",
  "Continued Practice",
  "Mastery",
] as const;
const IMPORTANCE = ["Low", "Medium", "High"] as const;

/** Shape Claude returns (snake_case, tolerant of missing optional fields). */
export const rawExtractionSchema = z.object({
  summary: z.string().default(""),
  skills: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        confidence: z.number().min(0).max(1).catch(0.5),
        learning_status: z.string().catch("New Learning"),
        importance: z.string().catch("Medium"),
        evidence: z.string().default(""),
      }),
    )
    .default([]),
  concepts: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        related_skill: z.string().default(""),
      }),
    )
    .default([]),
  learning_direction: z.array(z.string()).default([]),
  recommended_next_topics: z.array(z.string()).default([]),
});

export type RawExtraction = z.infer<typeof rawExtractionSchema>;

const asStatus = (v: string): LearningStatus =>
  (LEARNING_STATUS as readonly string[]).includes(v)
    ? (v as LearningStatus)
    : "New Learning";

const asImportance = (v: string): LearningImportance =>
  (IMPORTANCE as readonly string[]).includes(v)
    ? (v as LearningImportance)
    : "Medium";

/** Map validated raw JSON → domain shape (camelCase, typed enums, deduped). */
export function normalizeExtraction(raw: RawExtraction): LearningIntelligence {
  const seenSkill = new Set<string>();
  const skills = raw.skills
    .filter((s) => {
      const key = s.name.toLowerCase();
      if (seenSkill.has(key)) return false;
      seenSkill.add(key);
      return true;
    })
    .map((s) => ({
      name: s.name.trim(),
      confidence: s.confidence,
      learningStatus: asStatus(s.learning_status),
      importance: asImportance(s.importance),
      evidence: s.evidence.trim(),
    }));

  const seenConcept = new Set<string>();
  const concepts = raw.concepts
    .filter((c) => {
      const key = c.name.toLowerCase();
      if (seenConcept.has(key)) return false;
      seenConcept.add(key);
      return true;
    })
    .map((c) => ({ name: c.name.trim(), relatedSkill: c.related_skill.trim() }));

  return {
    summary: raw.summary.trim(),
    skills,
    concepts,
    learningDirection: raw.learning_direction
      .map((s) => s.trim())
      .filter(Boolean),
    recommendedTopics: raw.recommended_next_topics
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

export const emptyIntelligence = (): LearningIntelligence => ({
  summary: "",
  skills: [],
  concepts: [],
  learningDirection: [],
  recommendedTopics: [],
});
