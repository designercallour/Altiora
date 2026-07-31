import { PageContainer } from "@/components/shared/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonText } from "@/components/shared/skeletons";
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
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <Card>
            <CardContent>
              <SkeletonText lines={4} />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
