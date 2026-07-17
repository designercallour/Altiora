import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/session";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { Reveal } from "@/components/shared/motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ROLE_LABELS } from "@/lib/domain";
import { getInitials } from "@/lib/format";
import { AppearanceSettings } from "./appearance-settings";

export const metadata: Metadata = { title: "Settings" };

const NOTIFICATIONS = [
  {
    id: "weekly-reminder",
    label: "Weekly report reminder",
    description: "A gentle nudge when a new week's report is due.",
    checked: true,
  },
];

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const initials = user ? getInitials(user.fullName) : "AL";

  return (
    <PageContainer size="narrow">
      <Reveal>
        <PageHeader
          title="Settings"
          description="Manage your profile and how Altiora looks and feels."
        />
      </Reveal>

      <div className="mt-8 space-y-6">
        {/* Profile */}
        <Reveal delay={0.04}>
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Your identity across Altiora. Managed by Google Sign-In once
                authentication is connected.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar size="lg">
                  {user?.avatarUrl ? (
                    <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                  ) : null}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{user?.fullName}</p>
                  {user ? (
                    <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
                  ) : null}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" defaultValue={user?.fullName} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={user?.email}
                    disabled
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </Reveal>

        {/* Appearance */}
        <Reveal delay={0.08}>
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Choose a theme. System follows your device settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AppearanceSettings />
            </CardContent>
          </Card>
        </Reveal>

        {/* Notifications */}
        <Reveal delay={0.12}>
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Notification delivery arrives in a later phase — a preview of
                what you&rsquo;ll control.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-border divide-y py-0">
              {NOTIFICATIONS.map((n) => (
                <div
                  key={n.id}
                  className="flex items-center justify-between gap-4 py-4"
                >
                  <div className="space-y-0.5">
                    <Label htmlFor={n.id} className="font-medium">
                      {n.label}
                    </Label>
                    <p className="text-muted-foreground text-sm">
                      {n.description}
                    </p>
                  </div>
                  <Switch id={n.id} defaultChecked={n.checked} disabled />
                </div>
              ))}
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </PageContainer>
  );
}
