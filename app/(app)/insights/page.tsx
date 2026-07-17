import type { Metadata } from "next";
import {
  Sparkles,
  Brain,
  HeartPulse,
  TrendingUp,
  Building2,
  BookMarked,
} from "lucide-react";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { ComingSoon } from "@/components/shared/coming-soon";
import { Reveal } from "@/components/shared/motion";

export const metadata: Metadata = { title: "Insights" };

export default function InsightsPage() {
  return (
    <PageContainer>
      <Reveal>
        <PageHeader
          eyebrow="Organizational intelligence"
          title="Insights"
          description="Where weekly reflections become organizational learning — the questions Altiora will help you answer."
        />
      </Reveal>
      <Reveal delay={0.05}>
        <div className="mt-8">
          <ComingSoon
            icon={Sparkles}
            title="From reflections to intelligence"
            description="Insights turns thousands of learning logs, moods, and skill scores into a living picture of your internship program — which projects grow people fastest, when motivation dips, and where mentorship has the most impact."
            features={[
              {
                icon: Brain,
                label: "AI weekly summaries",
                description:
                  "Concise, generated summaries of each intern's week.",
              },
              {
                icon: HeartPulse,
                label: "Burnout detection",
                description:
                  "Early signals from mood and workload trends over time.",
              },
              {
                icon: TrendingUp,
                label: "Skill velocity",
                description: "Which skills improve fastest, and for whom.",
              },
              {
                icon: Building2,
                label: "Department outcomes",
                description:
                  "Compare learning outcomes across teams and cohorts.",
              },
              {
                icon: BookMarked,
                label: "Source effectiveness",
                description:
                  "Which learning sources drive the most durable growth.",
              },
              {
                icon: Sparkles,
                label: "Program health",
                description:
                  "A single, honest read on how the program is doing.",
              },
            ]}
          />
        </div>
      </Reveal>
    </PageContainer>
  );
}
