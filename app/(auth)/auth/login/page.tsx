import type { Metadata } from "next";
import { getDataSource, resolveDataSourceMode } from "@/services";
import { signInAsPersona } from "@/features/auth/actions";
import { GoogleSignInButton } from "@/features/auth/google-sign-in-button";
import { BrandMark } from "@/components/layout/brand";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/domain";
import type { AppUser, UserRole } from "@/types/domain";

export const metadata: Metadata = { title: "Sign in" };

const ROLE_ORDER: UserRole[] = ["admin", "mentor", "intern"];

export default async function LoginPage() {
  // Dev persona sign-in is a mock-mode affordance only. In supabase mode,
  // Google OAuth is the single entry point.
  const isMock = resolveDataSourceMode() === "mock";
  const users = isMock ? await getDataSource().listUsers() : [];
  const defaultUser =
    users.find((u) => u.role === "intern") ?? users[0] ?? null;

  const grouped = ROLE_ORDER.map((role) => ({
    role,
    users: users.filter((u) => u.role === role),
  })).filter((g) => g.users.length > 0);

  return (
    <main className="w-full max-w-sm">
      <div className="flex flex-col items-center text-center">
        <BrandMark className="size-10 rounded-xl" />
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          Welcome to Altiora
        </h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed text-balance">
          Callour Studio&rsquo;s internship intelligence platform. Reflect on
          your week, track your growth, and learn together.
        </p>
      </div>

      <div className="mt-8">
        <GoogleSignInButton defaultUserId={defaultUser?.id ?? ""} />
      </div>

      {/* Development-only persona switcher (mock mode). */}
      {isMock && grouped.length > 0 ? (
        <div className="mt-8">
          <div className="flex items-center gap-3">
            <span className="bg-border h-px flex-1" />
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Or continue as
            </span>
            <span className="bg-border h-px flex-1" />
          </div>
          <p className="text-muted-foreground mt-3 text-center text-xs">
            Development personas — preview any role without a live backend.
          </p>

          <div className="mt-4 space-y-4">
            {grouped.map((group) => (
              <div key={group.role} className="space-y-1.5">
                <p className="text-muted-foreground px-1 text-[11px] font-medium tracking-wide uppercase">
                  {ROLE_LABELS[group.role]}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {group.users.map((u) => (
                    <PersonaButton key={u.id} user={u} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </main>
  );
}

function PersonaButton({ user }: { user: AppUser }) {
  return (
    <form action={signInAsPersona.bind(null, user.id)}>
      <button
        type="submit"
        className="border-border bg-card hover:bg-accent/60 focus-visible:ring-ring/50 flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors outline-none focus-visible:ring-2"
      >
        <Avatar size="sm">
          <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium">
            {user.fullName}
          </span>
        </span>
      </button>
    </form>
  );
}
