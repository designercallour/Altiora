import type { Metadata } from "next";
import { getDataSource } from "@/services";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { Reveal } from "@/components/shared/motion";
import { MentorManagementList } from "@/features/admin/components/mentor-management-list";

export const metadata: Metadata = { title: "Mentors" };

export default async function AdminMentorsPage() {
  const mentors = await getDataSource().listMentors();
  const totalActive = mentors.reduce((n, m) => n + m.activeInternCount, 0);

  return (
    <PageContainer size="wide">
      <Reveal>
        <PageHeader
          eyebrow="Management"
          title="Mentors"
          description={`${mentors.length} mentor${
            mentors.length === 1 ? "" : "s"
          } supervising ${totalActive} active intern${
            totalActive === 1 ? "" : "s"
          }.`}
        />
      </Reveal>
      <div className="mt-8">
        <MentorManagementList mentors={mentors} />
      </div>
    </PageContainer>
  );
}
