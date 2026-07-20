import type { Metadata } from "next";
import { getDataSource } from "@/services";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { Reveal } from "@/components/shared/motion";
import { InternManagementList } from "@/features/admin/components/intern-management-list";
import { internshipStatus } from "@/lib/internship";

export const metadata: Metadata = { title: "Interns" };

export default async function AdminInternsPage() {
  const db = getDataSource();
  const [interns, cohorts, mentors] = await Promise.all([
    db.listInterns(),
    db.listCohorts(),
    db.listMentors(),
  ]);

  const activeCount = interns.filter(
    (s) => s.internship && internshipStatus(s.internship) === "active",
  ).length;

  return (
    <PageContainer size="wide">
      <Reveal>
        <PageHeader
          eyebrow="Management"
          title="Interns"
          description={`${interns.length} intern${
            interns.length === 1 ? "" : "s"
          } · ${activeCount} active right now.`}
        />
      </Reveal>
      <div className="mt-8">
        <InternManagementList
          interns={interns}
          cohorts={cohorts}
          mentors={mentors}
        />
      </div>
    </PageContainer>
  );
}
