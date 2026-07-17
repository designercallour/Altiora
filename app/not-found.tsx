import { Brand } from "@/components/layout/brand";
import { LinkButton } from "@/components/shared/link-button";
import { ROUTES } from "@/lib/constants";

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 p-8 text-center">
      <Brand href={ROUTES.dashboard} />
      <div className="space-y-2">
        <p className="text-primary text-sm font-medium tracking-widest uppercase">
          404
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          This page wandered off
        </h1>
        <p className="text-muted-foreground mx-auto max-w-sm text-sm leading-relaxed">
          The page you&rsquo;re looking for doesn&rsquo;t exist or may have
          moved.
        </p>
      </div>
      <LinkButton href={ROUTES.dashboard}>Back to dashboard</LinkButton>
    </main>
  );
}
