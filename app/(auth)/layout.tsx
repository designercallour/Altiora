export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden p-6">
      {/* Subtle iris glow behind the card — restrained, not a loud gradient. */}
      <div
        aria-hidden
        className="bg-primary/10 pointer-events-none absolute top-0 left-1/2 -z-10 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/3 rounded-full blur-3xl"
      />
      {children}
    </div>
  );
}
