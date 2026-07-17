import { PageContainer } from "@/components/shared/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SkeletonText } from "@/components/shared/skeletons";

export default function ReportDetailLoading() {
  return (
    <PageContainer size="narrow">
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-44" />
      </div>
      <div className="mt-8 space-y-6">
        <Card>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <Skeleton className="size-8 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="border-b">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent className="space-y-4">
            <SkeletonText lines={2} />
            <SkeletonText lines={2} />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
