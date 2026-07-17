import "server-only";
import type { LearningIntelligence } from "@/types/domain";
import {
  normalizeExtraction,
  rawExtractionSchema,
} from "@/schemas/learning-intelligence";
import { LEARNING_INTELLIGENCE_SYSTEM } from "./prompt";
import { stubExtract } from "./stub";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

/** Pull the first JSON object out of a model response (tolerates stray prose). */
function parseJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) throw new Error("no json");
  return JSON.parse(text.slice(start, end + 1));
}

async function callClaude(
  reflection: string,
  key: string,
): Promise<LearningIntelligence> {
  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      system: LEARNING_INTELLIGENCE_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Reflection:\n\n${reflection}`,
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text = data.content?.find((b) => b.type === "text")?.text ?? "";
  const parsed = rawExtractionSchema.parse(parseJson(text));
  return normalizeExtraction(parsed);
}

/**
 * Extract structured learning intelligence from a report's free-text.
 * Uses Claude (Haiku) when ANTHROPIC_API_KEY is set; otherwise a deterministic
 * local stub. Never throws — falls back to the stub on any API/parse error.
 */
export async function extractLearning(
  reflection: string,
): Promise<LearningIntelligence> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || !reflection.trim()) return stubExtract(reflection);
  try {
    return await callClaude(reflection, key);
  } catch {
    // Graceful degradation: a failed/whatever API call shouldn't block a submit.
    return stubExtract(reflection);
  }
}

/** Combine a report's reflection + learnings into one text blob for extraction. */
export function reflectionCorpus(input: {
  achievement?: string | null;
  challenge?: string | null;
  learnings: string[];
}): string {
  return [
    input.achievement ?? "",
    input.challenge ?? "",
    ...input.learnings,
  ]
    .map((s) => s.trim())
    .filter(Boolean)
    .join("\n\n");
}
