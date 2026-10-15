import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { safeNext } from "@/lib/candidate/types";
import { pauseSubscribePrompt, SUBSCRIBE_PROMPT_PAUSE_MS, shouldPromptSubscribe } from "@/lib/candidate/subscribe-prompt";

// --- Server side: the apply action and the account actions, with the API and cookies faked. ---
const api = vi.hoisted(() => ({ send: vi.fn(), token: "t".repeat(43) as string | null, cleared: 0 }));
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
  clearSession: async () => {
    api.cleared++;
  },
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
vi.mock("next-themes", () => ({ useTheme: () => ({ resolvedTheme: "light" }) }));

const { ApiRequestError } = await import("@/lib/api/client");
const { submitApplication } = await import("@/app/jobs/[slug]/apply/actions");
const { createAccount, deleteAccount, resendConfirmation } = await import("@/app/account/actions");

function application() {
  const data = new FormData();
  data.set("name", "Sara Khan");
  data.set("email", "someone-else@example.com");
  data.set("phone", "+92 300 1234567");
  data.set("consent", "true");
  data.set("answers", "{}");
  data.set("startedAt", String(Date.now() - 60_000));
  data.set("cv", new File(["%PDF-1.7"], "cv.pdf", { type: "application/pdf" }));
  return data;
}

beforeEach(() => {
  api.send.mockReset();
  api.token = "t".repeat(43);
  api.cleared = 0;
});

describe("only same-site addresses after signing in", () => {
  it("keeps paths on this site and drops everything else", () => {
    expect(safeNext("/jobs/react-native-developer/apply")).toBe("/jobs/react-native-developer/apply");
    expect(safeNext("//evil.test/x")).toBe("/account");
    expect(safeNext("https://evil.test")).toBe("/account");
    expect(safeNext("/\\evil.test")).toBe("/account");
    expect(safeNext("/jobs\r\nSet-Cookie: x")).toBe("/account");
    expect(safeNext(undefined, "/jobs")).toBe("/jobs");
  });
});

describe("the subscribe dialog after applying", () => {
  const memory = () => {
    const values = new Map<string, string>();
    return { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => void values.set(k, v) };
  };

  it("never asks subscribers, and 'Not now' waits 30 days", () => {
    const store = memory();
    expect(shouldPromptSubscribe(true, store)).toBe(false);
    expect(shouldPromptSubscribe(false, store)).toBe(true);
    pauseSubscribePrompt(store, 1_000);
    expect(shouldPromptSubscribe(false, store, 1_000 + SUBSCRIBE_PROMPT_PAUSE_MS - 1)).toBe(false);
    expect(shouldPromptSubscribe(false, store, 1_000 + SUBSCRIBE_PROMPT_PAUSE_MS + 1)).toBe(true);
  });

  it("still works when storage is blocked", () => {
    const blocked = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(shouldPromptSubscribe(false, blocked)).toBe(true);
    expect(() => pauseSubscribePrompt(blocked)).not.toThrow();
  });
});

describe("sending an application", () => {
  it("needs a signed-in candidate", async () => {
    api.token = null;
    expect(await submitApplication("support-engineer", application())).toMatchObject({ status: "signed_out" });
    expect(api.send).not.toHaveBeenCalled();
  });

  it("sends the session and never the typed email (the account's is used)", async () => {
    api.send.mockResolvedValue({ status: "submitted", message: "Application sent." });
    expect(await submitApplication("support-engineer", application())).toEqual({ status: "success", message: "Application sent." });
    const [path, options] = api.send.mock.calls[0];
    expect(path).toBe("/public/jobs/support-engineer/applications");
    expect(options).toMatchObject({ method: "POST", candidateSession: api.token });
    expect((options.body as FormData).get("email")).toBeNull();
    expect((options.body as FormData).get("cv")).toBeInstanceOf(File);
  });

  it("reports held and repeat applications", async () => {
    api.send.mockResolvedValueOnce({ status: "held", message: "Almost done: confirm your email" });
    expect(await submitApplication("support-engineer", application())).toEqual({ status: "held", message: "Almost done: confirm your email" });
    api.send.mockResolvedValueOnce({ status: "already_applied", message: "You've already applied for this job." });
    expect((await submitApplication("support-engineer", application())).status).toBe("already_applied");
  });

  it("asks them to sign in again when the session has ended", async () => {
    api.send.mockRejectedValue(new ApiRequestError(401, "candidate_unauthorized", "Please sign in"));
    expect((await submitApplication("support-engineer", application())).status).toBe("signed_out");
    expect(api.cleared).toBe(1);
  });
});

describe("account actions", () => {
  const signupForm = (over: Record<string, string> = {}) => {
    const data = new FormData();
    for (const [k, v] of Object.entries({ name: "Sam Seeker", email: "sam@example.com", password: "a-good-password", confirmPassword: "a-good-password", acceptTerms: "on", ...over })) data.set(k, v);
    return data;
  };

  it("checks the two passwords match before calling the API", async () => {
    const res = await createAccount(null, signupForm({ confirmPassword: "different-password" }));
    expect(res).toMatchObject({ status: "error", fieldErrors: { confirmPassword: "The passwords don't match" } });
    expect(api.send).not.toHaveBeenCalled();
  });

  it("passes the API's field errors through", async () => {
    api.send.mockRejectedValue(new ApiRequestError(409, "account_exists", "There's already an account for this email."));
    expect(await createAccount(null, signupForm())).toMatchObject({ status: "error", message: "There's already an account for this email." });
    expect(api.send.mock.calls[0][1].body).toEqual({ name: "Sam Seeker", email: "sam@example.com", password: "a-good-password", acceptTerms: true });
  });

  it("needs DELETE typed before deleting the account", async () => {
    const data = new FormData();
    data.set("confirm", "nope");
    expect((await deleteAccount(null, data)).status).toBe("error");
    expect(api.send).not.toHaveBeenCalled();
    data.set("confirm", "delete");
    api.send.mockResolvedValue(null);
    expect((await deleteAccount(null, data)).status).toBe("success");
    expect(api.send).toHaveBeenCalledWith("/public/candidate/me", expect.objectContaining({ method: "DELETE" }));
    expect(api.cleared).toBe(1);
  });

  it("signs out locally when the API no longer knows the session", async () => {
    api.send.mockRejectedValue(new ApiRequestError(401, "candidate_unauthorized", "Please sign in"));
    expect(await resendConfirmation()).toEqual({ status: "error", message: "Please sign in again." });
    expect(api.cleared).toBe(1);
  });
});

describe("the sign-in panel", () => {
  it("switches between creating an account and signing in, with the Terms box on sign-up", async () => {
    const { AuthPanel } = await import("@/components/account/AuthPanel");
    render(<AuthPanel next="/jobs/x/apply" />);
    expect(screen.getByTestId("signup-form")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Terms of Service" })).toHaveAttribute("href", "/terms");
    fireEvent.click(screen.getByRole("tab", { name: "Sign in" }));
    expect(screen.getByTestId("signin-form")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
    expect(screen.getByTestId("forgot-form")).toBeInTheDocument();
  });
  it("offers Google only when the page passes a client ID", async () => {
    const { AuthPanel } = await import("@/components/account/AuthPanel");
    const { unmount } = render(<AuthPanel next="/account" />);
    expect(screen.queryByTestId("google-button")).not.toBeInTheDocument();
    expect(screen.queryByText("or with email")).not.toBeInTheDocument();
    unmount();
    render(<AuthPanel next="/account" googleClientId="123-abc.apps.googleusercontent.com" />);
    expect(screen.getByTestId("google-button")).toBeInTheDocument();
    expect(screen.getByText("or with email")).toBeInTheDocument();
  });
});

describe("the Google client ID", () => {
  it("is read when the page is served, under either name, and ignores values that aren't client IDs", async () => {
    const { googleClientId } = await import("@/lib/env");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "");
    vi.stubEnv("GOOGLE_CLIENT_ID", "");
    expect(googleClientId()).toBeUndefined();
    vi.stubEnv("GOOGLE_CLIENT_ID", "123-abc.apps.googleusercontent.com");
    expect(googleClientId()).toBe("123-abc.apps.googleusercontent.com");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", " 456-def.apps.googleusercontent.com ");
    expect(googleClientId()).toBe("456-def.apps.googleusercontent.com");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "not-a-client-id");
    expect(googleClientId()).toBe("123-abc.apps.googleusercontent.com");
    vi.unstubAllEnvs();
  });
});
