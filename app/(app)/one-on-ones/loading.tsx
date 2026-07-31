import { PageContainer } from "@/components/shared/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonList } from "@/components/shared/skeletons";

export default function Loading() {
  return (
    <PageContainer>
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="border-border mt-8 rounded-xl border p-4">
        <SkeletonList rows={6} />
      </div>
    </PageContainer>
  );
}
