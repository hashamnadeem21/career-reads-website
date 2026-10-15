import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { applicationStatus, fileSize } from "@/lib/candidate/application-status";
import type { MyApplication, SavedCv } from "@/lib/candidate/types";

const api = vi.hoisted(() => ({ send: vi.fn(), token: "t".repeat(43) as string | null }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": "203.0.113.9" }),
  cookies: async () => ({ get: () => undefined, set: vi.fn(), delete: vi.fn() }),
}));
vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/client")>()),
  hasApi: () => true,
  apiSend: api.send,
}));
vi.mock("@/lib/candidate/session", () => ({
  sessionToken: async () => api.token,
  clearSession: vi.fn(),
  storeSession: vi.fn(),
  visitor: async () => ({ ip: "203.0.113.9", userAgent: "test" }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const { submitApplication } = await import("@/app/jobs/[slug]/apply/actions");
const { uploadCv } = await import("@/app/account/actions");
const { MyApplications } = await import("@/components/account/MyApplications");
const { ApplyForm } = await import("@/components/jobs/ApplyForm");

const savedCv: SavedCv = { name: "Sara CV.pdf", contentType: "application/pdf", sizeBytes: 240_000, uploadedAt: "2026-10-12T09:00:00.000Z" };

const application = (over: Partial<MyApplication> = {}): MyApplication => ({
  id: "0b6f1f5e-5c2a-4b8e-9d3c-2f1e0a9b8c7d",
  job: { title: "Support Engineer", company: "Acme", slug: "support-engineer-acme", open: true },
  status: "new",
  awaitingConfirmation: false,
  appliedAt: "2026-10-12T09:00:00.000Z",
  statusChangedAt: "2026-10-12T09:00:00.000Z",
  cv: { name: "Sara CV.pdf" },
  ...over,
});

function applicationForm(cv: "file" | "saved" | "none") {
  const data = new FormData();
  data.set("name", "Sara Khan");
  data.set("phone", "+92 300 1234567");
  data.set("consent", "true");
  data.set("answers", "{}");
  data.set("startedAt", String(Date.now() - 60_000));
  if (cv === "file") data.set("cv", new File(["%PDF-1.7"], "cv.pdf", { type: "application/pdf" }));
  if (cv === "saved") data.set("useSavedCv", "true");
  return data;
}

beforeEach(() => {
  api.send.mockReset();
  api.token = "t".repeat(43);
});

describe("application status, as the candidate reads it", () => {
  it("puts the employer's status in plain, kind words", () => {
    expect(applicationStatus({ status: "new", awaitingConfirmation: false }).label).toBe("Sent");
    expect(applicationStatus({ status: "shortlisted", awaitingConfirmation: false }).label).toBe("Shortlisted");
    expect(applicationStatus({ status: "interviewing", awaitingConfirmation: false }).label).toBe("Interview");
    expect(applicationStatus({ status: "rejected", awaitingConfirmation: false })).toMatchObject({ label: "Not selected", tone: "closed" });
    expect(applicationStatus({ status: "hired", awaitingConfirmation: false }).tone).toBe("good");
  });

  it("says when an application is waiting for their email confirmation", () => {
    expect(applicationStatus({ status: "new", awaitingConfirmation: true })).toMatchObject({ label: "Confirm your email", tone: "waiting" });
  });

  it("shows file sizes simply", () => {
    expect(fileSize(240_000)).toBe("234 KB");
    expect(fileSize(1_300_000)).toBe("1.2 MB");
  });
});

describe("My applications", () => {
  it("points to the jobs when there are none yet", () => {
    render(<MyApplications applications={[]} />);
    expect(screen.getByText("You haven't applied for any jobs yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse jobs" })).toHaveAttribute("href", "/jobs");
  });

  it("lists each job with its status and the CV that was sent", () => {
    render(
      <MyApplications
        applications={[
          application({ status: "shortlisted", statusChangedAt: "2026-10-14T09:00:00.000Z" }),
          application({ id: "1b6f1f5e-5c2a-4b8e-9d3c-2f1e0a9b8c7d", job: { title: "Old Role", company: "Globex", slug: "old-role", open: false }, status: "rejected" }),
        ]}
      />,
    );
    const [first, second] = within(screen.getByTestId("my-applications")).getAllByRole("listitem");
    expect(within(first).getByRole("link", { name: "Support Engineer" })).toHaveAttribute("href", "/jobs/support-engineer-acme");
    expect(within(first).getByText("Shortlisted")).toBeInTheDocument();
    expect(within(first).getByText("Updated 14 Oct 2026")).toBeInTheDocument();
    expect(within(first).getByRole("link", { name: /CV sent: Sara CV.pdf/ })).toHaveAttribute(
      "href",
      "/account/applications/0b6f1f5e-5c2a-4b8e-9d3c-2f1e0a9b8c7d/cv",
    );
    // A job that's no longer on the site isn't linked.
    expect(within(second).queryByRole("link", { name: "Old Role" })).not.toBeInTheDocument();
    expect(within(second).getByText("Not selected")).toBeInTheDocument();
  });
});

describe("applying with the saved CV", () => {
  it("sends useSavedCv instead of a file", async () => {
    api.send.mockResolvedValue({ status: "submitted", message: "Application sent." });
    expect(await submitApplication("support-engineer-acme", applicationForm("saved"))).toMatchObject({ status: "success" });
    const body = api.send.mock.calls[0][1].body as FormData;
    expect(body.get("useSavedCv")).toBe("true");
    expect(body.get("cv")).toBeNull();
  });

  it("still needs a CV one way or the other", async () => {
    expect(await submitApplication("support-engineer-acme", applicationForm("none"))).toMatchObject({ fieldErrors: { cv: "Attach your CV" } });
    expect(api.send).not.toHaveBeenCalled();
  });

  it("offers the saved CV first, with a way to upload a different one", () => {
    render(
      <ApplyForm
        slug="support-engineer-acme"
        jobTitle="Support Engineer"
        company="Acme"
        questions={[]}
        candidate={{ name: "Sara Khan", email: "sara@example.com", emailVerified: true, subscribed: false }}
        savedCv={savedCv}
      />,
    );
    // The CV step (step 2 of the form) is rendered but hidden until they get there.
    const saved = screen.getByRole("radio", { name: /Use my saved CV/, hidden: true });
    expect(saved).toBeChecked();
    expect(screen.getByText(/Sara CV.pdf · 234 KB · uploaded 12 Oct 2026/)).toBeInTheDocument();
    const uploadBox = () => screen.getByText("Upload your CV").closest("label");
    expect(uploadBox()).toHaveClass("hidden");
    fireEvent.click(screen.getByRole("radio", { name: /Upload a different CV/, hidden: true }));
    expect(uploadBox()).toHaveClass("flex");
    expect(uploadBox()).not.toHaveClass("hidden");
  });
});

describe("updating the saved CV", () => {
  it("checks the file before sending it", async () => {
    const data = new FormData();
    expect(await uploadCv(null, data)).toMatchObject({ fieldErrors: { cv: "Choose your CV" } });
    data.set("cv", new File(["x"], "cv.doc"));
    expect(await uploadCv(null, data)).toMatchObject({ fieldErrors: { cv: /PDF or Word/ } });
    expect(api.send).not.toHaveBeenCalled();
  });

  it("uploads it to the account", async () => {
    api.send.mockResolvedValue({ cv: savedCv });
    const data = new FormData();
    data.set("cv", new File(["%PDF-1.7"], "Sara CV.pdf", { type: "application/pdf" }));
    expect(await uploadCv(null, data)).toMatchObject({ status: "success" });
    expect(api.send).toHaveBeenCalledWith("/public/candidate/cv", expect.objectContaining({ method: "POST", candidateSession: api.token }));
    expect((api.send.mock.calls[0][1].body as FormData).get("cv")).toBeInstanceOf(File);
  });
});
