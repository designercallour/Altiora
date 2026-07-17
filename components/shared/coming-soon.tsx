import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ComingSoonFeature {
  icon: LucideIcon;
  label: string;
  description: string;
}

interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
  description: string;
  features?: ComingSoonFeature[];
  className?: string;
}

export function ComingSoon({
  icon: Icon,
  title,
  description,
  features,
  className,
}: ComingSoonProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="gap-0">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
              <Icon className="size-5" aria-hidden />
            </span>
            <Badge variant="secondary">In development</Badge>
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-lg">{title}</CardTitle>
            <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </CardHeader>
      {features?.length ? (
        <CardContent>
          <div className="grid gap-x-6 gap-y-5 border-t pt-5 sm:grid-cols-2">
            {features.map((f) => (
              <div key={f.label} className="flex items-start gap-3">
                <span className="text-muted-foreground mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border">
                  <f.icon className="size-4" aria-hidden />
                </span>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{f.label}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}
