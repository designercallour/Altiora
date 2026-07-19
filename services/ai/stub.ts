/**
 * Deterministic, offline stand-in for the Claude extraction. Used in mock mode
 * and whenever ANTHROPIC_API_KEY is absent, so dashboards populate without an
 * API call. Not as nuanced as the real model — a keyword→competency mapping —
 * but stable and dependency-free.
 */
import type {
  ExtractedConcept,
  ExtractedSkill,
  LearningImportance,
  LearningIntelligence,
  LearningStatus,
} from "@/types/domain";

interface Rule {
  skill: string;
  keywords: string[];
  concepts?: string[];
  next?: string[];
}

const RULES: Rule[] = [
  { skill: "UX Research", keywords: ["research", "interview", "usability", "user test", "user testing", "insight"], concepts: ["User Interview", "Usability Testing"], next: ["Survey Design", "Affinity Mapping"] },
  { skill: "UI Design", keywords: ["ui", "interface", "visual", "layout", "screen", "component"], concepts: ["Component Variants", "Layout Grids"], next: ["Design System", "Motion Design"] },
  { skill: "Design System", keywords: ["design system", "token", "variant", "auto layout", "library"], concepts: ["Design Tokens", "Component Variants", "Auto Layout Variables"], next: ["Theming", "Governance"] },
  { skill: "Prototyping", keywords: ["prototype", "prototyping", "interactive"], concepts: ["Clickable Prototype", "Smart Animate"], next: ["Interaction Design"] },
  { skill: "Wireframing", keywords: ["wireframe", "low-fidelity", "lo-fi", "sketch"], concepts: ["Lo-fi Wireframes"], next: ["Prototyping"] },
  { skill: "Presentation", keywords: ["present", "presentation", "rationale", "slides", "demo"], concepts: ["Design Rationale", "Storytelling"], next: ["Stakeholder Communication"] },
  { skill: "Stakeholder Communication", keywords: ["stakeholder", "client", "senior", "leadership", "align"], concepts: ["Stakeholder Alignment"], next: ["Facilitation"] },
  { skill: "Prompt Engineering", keywords: ["prompt", "ai", "llm", "claude", "gpt", "model"], concepts: ["Prompt Patterns", "AI-assisted Research"], next: ["AI Workflow", "Evaluation"] },
  { skill: "Accessibility", keywords: ["accessibility", "a11y", "contrast", "screen reader", "wcag"], concepts: ["Color Contrast", "Keyboard Navigation"], next: ["Inclusive Design"] },
  { skill: "Typography", keywords: ["typography", "typeface", "font", "type scale"], concepts: ["Type Scale"], next: ["Visual Design"] },
  { skill: "UX Writing", keywords: ["microcopy", "copy", "wording", "content", "empty state"], concepts: ["Microcopy", "Content Design"], next: ["Content Strategy"] },
  { skill: "Design Handoff", keywords: ["handoff", "spec", "developer", "engineer", "implementation"], concepts: ["Redlines", "Dev Specs"], next: ["Design Tokens"] },
  { skill: "Visual Design", keywords: ["mood board", "moodboard", "aesthetic", "brand", "color palette"], concepts: ["Mood Board", "Visual Hierarchy"], next: ["Typography"] },
  { skill: "Journey Mapping", keywords: ["journey", "flow", "user flow", "map", "funnel"], concepts: ["User Flow", "Journey Map"], next: ["Service Design"] },
  { skill: "Interaction Design", keywords: ["interaction", "animation", "motion", "transition", "micro-interaction"], concepts: ["Micro-interactions", "Motion"], next: ["Prototyping"] },
  { skill: "Information Architecture", keywords: ["information architecture", "navigation", "hierarchy", "structure", "taxonomy"], concepts: ["Site Map", "Card Sorting"], next: ["UX Research"] },
  { skill: "Product Thinking", keywords: ["onboarding", "product", "feature", "metric", "roadmap", "impact"], concepts: ["Product Metrics"], next: ["Problem Framing"] },
  { skill: "Problem Framing", keywords: ["problem", "framing", "define", "requirement", "scope"], concepts: ["Problem Statement"], next: ["Product Thinking"] },
  { skill: "Time Management", keywords: ["deadline", "estimate", "planning", "prioritize", "time"], concepts: ["Estimation"], next: ["Prioritization"] },
  { skill: "Collaboration", keywords: ["team", "collaborat", "pair", "cross-functional", "communication"], concepts: ["Pairing"], next: ["Facilitation"] },
];

const IMPORTANCE_BY_RANK: LearningImportance[] = ["High", "High", "Medium"];

function statusFor(count: number): LearningStatus {
  if (count >= 3) return "Mastery";
  if (count === 2) return "Continued Practice";
  return "New Learning";
}

export function stubExtract(reflection: string): LearningIntelligence {
  const text = reflection.toLowerCase();
  if (!text.trim()) {
    return {
      summary: "",
      skills: [],
      concepts: [],
      learningDirection: [],
      recommendedTopics: [],
    };
  }

  const matched: { rule: Rule; hits: number; firstAt: number }[] = [];
  for (const rule of RULES) {
    let hits = 0;
    let firstAt = Infinity;
    for (const kw of rule.keywords) {
      const idx = text.indexOf(kw);
      if (idx !== -1) {
        hits += 1;
        firstAt = Math.min(firstAt, idx);
      }
    }
    if (hits > 0) matched.push({ rule, hits, firstAt });
  }

  matched.sort((a, b) => b.hits - a.hits || a.firstAt - b.firstAt);
  const top = matched.slice(0, 6);

  const skills: ExtractedSkill[] = top.map((m, i) => ({
    name: m.rule.skill,
    confidence: Math.min(0.95, 0.6 + m.hits * 0.12),
    learningStatus: statusFor(m.hits),
    importance: IMPORTANCE_BY_RANK[i] ?? "Low",
    evidence: "",
  }));

  const concepts: ExtractedConcept[] = [];
  const seen = new Set<string>();
  for (const m of top) {
    for (const c of m.rule.concepts ?? []) {
      const key = c.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      concepts.push({ name: c, relatedSkill: m.rule.skill });
    }
  }

  const learningDirection = top
    .slice(0, 2)
    .map((m) => `Deepening ${m.rule.skill}`);
  const recommendedTopics = Array.from(
    new Set(top.flatMap((m) => m.rule.next ?? [])),
  ).slice(0, 4);

  return {
    summary: top.length
      ? `Practised ${top
          .slice(0, 3)
          .map((m) => m.rule.skill)
          .join(", ")}.`
      : "",
    skills,
    concepts,
    learningDirection,
    recommendedTopics,
  };
}
