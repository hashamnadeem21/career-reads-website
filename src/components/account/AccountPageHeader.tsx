/** A dashboard tab's title and one line on what it's for. */
export function AccountPageHeader({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-1.5 text-muted">{children}</p>
    </header>
  );
}
