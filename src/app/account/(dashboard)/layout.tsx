import { AccountNav } from "@/components/account/AccountNav";
import { Avatar } from "@/components/account/Avatar";
import { currentCandidate, myApplications } from "@/lib/candidate/session";

/**
 * The account dashboard: who's signed in and the tabs on the left, the tab's page on the right.
 * Each page checks the session itself (layouts don't re-render on navigation), so signed out this
 * only wraps the page's redirect.
 */
export default async function AccountDashboardLayout({ children }: { children: React.ReactNode }) {
  const [candidate, mine] = await Promise.all([currentCandidate(), myApplications()]);
  if (!candidate) return children;

  return (
    <div className="container-page max-w-5xl py-8 sm:py-12">
      {/* minmax(0, …): the tab row scrolls sideways on phones instead of widening the page. */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-[240px_minmax(0,1fr)] md:gap-10">
        <aside className="min-w-0 md:sticky md:top-24 md:self-start">
          <div className="mb-4 flex items-center gap-3 md:mb-6">
            <Avatar name={candidate.name} url={candidate.avatarUrl} size={44} />
            <div className="min-w-0">
              <p className="truncate font-semibold">{candidate.name}</p>
              <p className="truncate text-sm text-muted">{candidate.email}</p>
            </div>
          </div>
          <AccountNav applications={mine ? mine.applications.length : null} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
