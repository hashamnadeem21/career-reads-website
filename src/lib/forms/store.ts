import "server-only";
import { apiPath, apiPost, hasApi } from "@/lib/api/client";
import type { ContactInput } from "./schemas";

/**
 * Saves form submissions to the admin panel's inbox through the API. Returns true when
 * stored, false when storing failed, and null when no API is configured.
 * `ip` is the visitor's address, so the API rate-limits per visitor.
 */
export async function storeContactMessage(
  input: Pick<ContactInput, "name" | "email" | "topic" | "message">,
  ip: string | null,
): Promise<boolean | null> {
  if (!hasApi()) return null;
  try {
    await apiPost(
      apiPath("/public/contact"),
      { name: input.name, email: input.email, topic: input.topic, message: input.message },
      { ip },
    );
    return true;
  } catch (error) {
    console.error("[contact] Could not save the message through the API", error);
    return false;
  }
}

export async function storeSubscriber(email: string, ip: string | null): Promise<boolean | null> {
  if (!hasApi()) return null;
  try {
    await apiPost(apiPath("/public/subscribe"), { email }, { ip });
    return true;
  } catch (error) {
    console.error("[newsletter] Could not save the subscriber through the API", error);
    return false;
  }
}
