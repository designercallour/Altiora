import type { Metadata } from "next";
import { MessagesSquare, Target, Star, History, Users } from "lucide-react";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { ComingSoon } from "@/components/shared/coming-soon";
import { Reveal } from "@/components/shared/motion";

export const metadata: Metadata = { title: "Feedback" };

export default function FeedbackPage() {
  return (
    <PageContainer>
      <Reveal>
        <PageHeader
          eyebrow="Mentorship & growth"
          title="Feedback"
          description="A shared thread of mentor guidance, ratings, and goals across every week."
        />
      </Reveal>
      <Reveal delay={0.05}>
        <div className="mt-8">
          <ComingSoon
            icon={MessagesSquare}
            title="A continuous feedback loop"
            description="Feedback brings every mentor note, rating, and next goal into one calm timeline — so growth is a conversation, not a form."
            features={[
              {
                icon: Target,
                label: "Goal tracking",
                description:
                  "Carry each week's next goal into the following one.",
              },
              {
                icon: Star,
                label: "Ratings over time",
                description: "See how mentor ratings trend across the program.",
              },
              {
                icon: History,
                label: "Feedback history",
                description: "A single thread of guidance, week by week.",
              },
              {
                icon: Users,
                label: "Mentor analytics",
                description:
                  "Understand where mentorship drives the most growth.",
              },
            ]}
          />
        </div>
      </Reveal>
    </PageContainer>
  );
}
