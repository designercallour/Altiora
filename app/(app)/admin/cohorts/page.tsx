import type { Metadata } from "next";
import { getDataSource } from "@/services";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { Reveal } from "@/components/shared/motion";
import { CohortManagementList } from "@/features/admin/components/cohort-management-list";

export const metadata: Metadata = { title: "Cohorts" };

export default async function AdminCohortsPage() {
  const db = getDataSource();
  const [cohorts, interns] = await Promise.all([
    db.listCohorts(),
    db.listInterns(),
  ]);

  const counts: Record<string, number> = {};
  for (const s of interns) {
    const id = s.internship?.cohortId;
    if (id) counts[id] = (counts[id] ?? 0) + 1;
  }

  return (
    <PageContainer>
      <Reveal>
        <PageHeader
          eyebrow="Management"
          title="Cohorts"
          description={`${cohorts.length} cohort${
            cohorts.length === 1 ? "" : "s"
          } organizing the program.`}
        />
      </Reveal>
      <div className="mt-8">
        <CohortManagementList cohorts={cohorts} counts={counts} />
      </div>
    </PageContainer>
  );
}
