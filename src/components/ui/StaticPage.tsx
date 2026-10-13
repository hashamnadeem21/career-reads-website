import type { ReactNode } from "react";
import { CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/ui/SectionHeading";
import { formatDate } from "@/lib/utils";

/** Layout for policy and informational pages with long-form prose. */
export function StaticPage({
  eyebrow,
  title,
  description,
  path,
  lastUpdated,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  path: string;
  lastUpdated?: string;
  children: ReactNode;
}) {
  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        crumbs={[{ name: title, path }]}
        facts={
          lastUpdated
            ? [{ icon: CalendarClock, label: <>Last updated <time dateTime={lastUpdated}>{formatDate(lastUpdated)}</time></> }]
            : undefined
        }
      />
      <div className="container-page py-12">
        <div className="prose prose-lg prose-article mx-auto max-w-3xl dark:prose-invert">
          {children}
        </div>
      </div>
    </>
  );
}
