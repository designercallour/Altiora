"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { PageContainer } from "@/components/shared/page-container";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageContainer>
      <div className="pt-10">
        <ErrorState
          description="We couldn't load this page. This is usually temporary — try again."
          action={<Button onClick={reset}>Try again</Button>}
        />
      </div>
    </PageContainer>
  );
}
