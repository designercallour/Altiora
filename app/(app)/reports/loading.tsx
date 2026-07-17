import { PageContainer } from "@/components/shared/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonList } from "@/components/shared/skeletons";
import { Card, CardContent } from "@/components/ui/card";

export default function ReportsLoading() {
  return (
    <PageContainer>
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <Card className="mt-8">
        <CardContent className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-9 w-36" />
        </CardContent>
      </Card>
      <div className="mt-10">
        <SkeletonList rows={5} />
      </div>
    </PageContainer>
  );
}
