/**
 * Canonical seed content for the mock dataset.
 *
 * Plain content only — no ids or timestamps (the generator assigns those
 * deterministically). Kept in sync with `supabase/seed.sql` by hand.
 */

export const DEPARTMENTS = [
  { name: "Design", slug: "design" },
  { name: "Engineering", slug: "engineering" },
  { name: "Product", slug: "product" },
  { name: "Marketing", slug: "marketing" },
] as const;

export const TEAMS = [
  { name: "Brand", slug: "brand", departmentSlug: "design" },
  { name: "Product Design", slug: "product-design", departmentSlug: "design" },
  { name: "Web", slug: "web", departmentSlug: "engineering" },
  { name: "Platform", slug: "platform", departmentSlug: "engineering" },
  { name: "Growth", slug: "growth", departmentSlug: "product" },
  { name: "Content", slug: "content", departmentSlug: "marketing" },
] as const;

export const COHORTS = [
  {
    name: "Spring 2026",
    slug: "spring-2026",
    startDate: "2026-02-02",
    endDate: "2026-05-01",
  },
  {
    name: "Summer 2026",
    slug: "summer-2026",
    startDate: "2026-05-11",
    endDate: "2026-08-07",
  },
] as const;

export const PROJECTS = [
  {
    name: "Altiora Platform",
    slug: "altiora-platform",
    departmentSlug: "product",
  },
  {
    name: "Client Portal Revamp",
    slug: "client-portal",
    departmentSlug: "engineering",
  },
  { name: "Brand System 2.0", slug: "brand-system", departmentSlug: "design" },
  { name: "Mobile App", slug: "mobile-app", departmentSlug: "engineering" },
  {
    name: "Marketing Site",
    slug: "marketing-site",
    departmentSlug: "marketing",
  },
  { name: "Design Ops", slug: "design-ops", departmentSlug: "design" },
] as const;

export const SKILL_CATEGORIES = [
  { name: "Craft", slug: "craft", sortOrder: 1 },
  { name: "Thinking", slug: "thinking", sortOrder: 2 },
  { name: "Communication", slug: "communication", sortOrder: 3 },
  { name: "Delivery", slug: "delivery", sortOrder: 4 },
] as const;

/** The 8 rated skills (order matches RATED_SKILL_SLUGS). */
export const SKILLS = [
  { name: "UI Design", slug: "ui-design", categorySlug: "craft", sortOrder: 1 },
  {
    name: "UX Thinking",
    slug: "ux-thinking",
    categorySlug: "craft",
    sortOrder: 2,
  },
  {
    name: "Communication",
    slug: "communication",
    categorySlug: "communication",
    sortOrder: 3,
  },
  {
    name: "Problem Solving",
    slug: "problem-solving",
    categorySlug: "thinking",
    sortOrder: 4,
  },
  {
    name: "Critical Thinking",
    slug: "critical-thinking",
    categorySlug: "thinking",
    sortOrder: 5,
  },
  {
    name: "Presentation",
    slug: "presentation",
    categorySlug: "communication",
    sortOrder: 6,
  },
  {
    name: "Time Management",
    slug: "time-management",
    categorySlug: "delivery",
    sortOrder: 7,
  },
  {
    name: "Research",
    slug: "research",
    categorySlug: "thinking",
    sortOrder: 8,
  },
] as const;

export const LEARNING_CATEGORIES = [
  { name: "UI Design", slug: "ui-design", sortOrder: 1 },
  { name: "UX", slug: "ux", sortOrder: 2 },
  { name: "Research", slug: "research", sortOrder: 3 },
  { name: "Communication", slug: "communication", sortOrder: 4 },
  { name: "Presentation", slug: "presentation", sortOrder: 5 },
  { name: "Business", slug: "business", sortOrder: 6 },
  { name: "AI", slug: "ai", sortOrder: 7 },
  { name: "Coding", slug: "coding", sortOrder: 8 },
  { name: "Soft Skill", slug: "soft-skill", sortOrder: 9 },
  { name: "Other", slug: "other", sortOrder: 10 },
] as const;

export const LEARNING_SOURCES = [
  { name: "Mentor", slug: "mentor", sortOrder: 1 },
  { name: "Project", slug: "project", sortOrder: 2 },
  { name: "Client", slug: "client", sortOrder: 3 },
  { name: "Self Learning", slug: "self-learning", sortOrder: 4 },
  { name: "Youtube", slug: "youtube", sortOrder: 5 },
  { name: "Course", slug: "course", sortOrder: 6 },
  { name: "Article", slug: "article", sortOrder: 7 },
  { name: "Book", slug: "book", sortOrder: 8 },
] as const;

export const ADMIN = {
  fullName: "Callour Admin",
  email: "admin@callourstudio.com",
} as const;

export const MENTORS = [
  { fullName: "Aria Nakamura", email: "aria@callourstudio.com" },
  { fullName: "Devon Reyes", email: "devon@callourstudio.com" },
] as const;

export const INTERNS = [
  { fullName: "Maya Putri", email: "maya@callourstudio.com" },
  { fullName: "Leo Hartono", email: "leo@callourstudio.com" },
  { fullName: "Sofia Alvarez", email: "sofia@callourstudio.com" },
  { fullName: "Nadia Rahman", email: "nadia@callourstudio.com" },
  { fullName: "Kai Winarno", email: "kai@callourstudio.com" },
  { fullName: "Priya Sharma", email: "priya@callourstudio.com" },
  { fullName: "Ethan Cole", email: "ethan@callourstudio.com" },
  { fullName: "Tara Sinaga", email: "tara@callourstudio.com" },
  { fullName: "Marco Bianchi", email: "marco@callourstudio.com" },
  { fullName: "Yuki Tanaka", email: "yuki@callourstudio.com" },
] as const;

export const POSITIONS = [
  "UI Design Intern",
  "UX Design Intern",
  "Product Design Intern",
  "Design Research Intern",
  "Brand Design Intern",
] as const;

// ── Qualitative text banks ─────────────────────────────────────────────────────
export const ACHIEVEMENTS = [
  "Shipped my first end-to-end flow for the onboarding screens.",
  "Redesigned the empty states and got them approved in the first review.",
  "Ran my first usability test with three participants and synthesized the findings.",
  "Built a reusable component set that the whole team started using.",
  "Presented the design rationale to the client and handled the questions confidently.",
  "Improved the checkout conversion mockups after digging into the analytics.",
  "Learned the token system and migrated two screens to it.",
  "Facilitated a small workshop to align on the information architecture.",
];

export const CHALLENGES = [
  "Balancing polish with speed — I spent too long on details early in the week.",
  "Understanding the legacy codebase conventions before making changes.",
  "Getting clarity on ambiguous requirements from the brief.",
  "Saying no to scope creep during the client sync.",
  "Estimating how long a task would actually take.",
  "Presenting to a room of senior stakeholders for the first time.",
  "Context-switching between two projects in the same day.",
  "Handling conflicting feedback from two reviewers.",
];

export const SOLUTIONS = [
  "Time-boxed exploration to two hours, then moved to a decision.",
  "Paired with my mentor for 30 minutes to unblock quickly.",
  "Wrote down the open questions and confirmed them async before starting.",
  "Broke the work into smaller tasks and shipped the first slice early.",
  "Rehearsed the presentation once with a peer beforehand.",
  "Created a simple decision log to track why choices were made.",
  "Asked for a quick alignment call instead of guessing.",
  "Used a checklist to keep the handoff consistent.",
];

export const MENTOR_HELP = [
  "Would love a review of my component naming before I go further.",
  "Some guidance on prioritizing the backlog for next week.",
  "Help interpreting the research findings would be great.",
  "Feedback on whether my presentation structure lands.",
  "A quick intro to the client's brand guidelines.",
  "",
  "",
  "Not blocked this week — just want a sanity check on the direction.",
];

export const LEARNING_TITLES = [
  "Auto-layout patterns for responsive components",
  "Writing clearer microcopy for empty states",
  "How to run a lightweight usability test",
  "Design tokens and theming fundamentals",
  "Structuring a design critique",
  "Accessibility contrast requirements (WCAG AA)",
  "Prototyping micro-interactions",
  "Information architecture card sorting",
  "Prompting techniques for AI-assisted research",
  "Handoff specs that developers actually use",
  "Reading a funnel analytics dashboard",
  "Facilitating a stakeholder alignment session",
  "Version control basics for designers",
  "Building a mood board that communicates intent",
  "Presenting design rationale to clients",
  "Estimating design tasks realistically",
  "Systemizing spacing and layout grids",
  "User interview note-taking frameworks",
];
