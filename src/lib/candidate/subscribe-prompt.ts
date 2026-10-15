/**
 * The "Subscribe to our newsletter?" dialog after applying. It never shows to subscribers, and
 * "Not now" hides it on this device for 30 days.
 */
export const SUBSCRIBE_PROMPT_KEY = "careerreads:subscribe-prompt-dismissed";
export const SUBSCRIBE_PROMPT_PAUSE_MS = 30 * 24 * 60 * 60 * 1000;

type Store = Pick<Storage, "getItem" | "setItem">;

export function shouldPromptSubscribe(subscribed: boolean, storage: Store | null, now = Date.now()): boolean {
  if (subscribed) return false;
  try {
    const dismissedAt = Number(storage?.getItem(SUBSCRIBE_PROMPT_KEY));
    return !(Number.isFinite(dismissedAt) && dismissedAt > 0 && now - dismissedAt < SUBSCRIBE_PROMPT_PAUSE_MS);
  } catch {
    return true;
  }
}

export function pauseSubscribePrompt(storage: Store | null, now = Date.now()): void {
  try {
    storage?.setItem(SUBSCRIBE_PROMPT_KEY, String(now));
  } catch {
    // Storage blocked: it may ask again next time, which is fine.
  }
}
