import { PageContainer } from "@/components/shared/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SkeletonStatCard,
  SkeletonText,
} from "@/components/shared/skeletons";
import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <PageContainer>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-64" />
      </div>

      <div className="mt-8 space-y-10">
        <Card>
          <CardContent>
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Skeleton className="h-5 w-56" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </div>
        </div>

        <Card>
          <CardContent>
            <SkeletonText lines={6} />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
