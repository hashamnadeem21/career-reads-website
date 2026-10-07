import "server-only";
import { messages, subscribers } from "@/db/schema";
import { getDb } from "@/lib/db";
import type { ContactInput } from "./schemas";

/**
 * Saves form submissions to the admin panel's inbox. Returns true when stored,
 * false when storing failed, and null when no database is configured.
 */
export async function storeContactMessage(input: Pick<ContactInput, "name" | "email" | "topic" | "message">): Promise<boolean | null> {
  const db = getDb();
  if (!db) return null;
  try {
    await db.insert(messages).values({ name: input.name, email: input.email, topic: input.topic || null, message: input.message });
    return true;
  } catch (error) {
    console.error("[contact] Could not save the message to the database", error);
    return false;
  }
}

export async function storeSubscriber(email: string): Promise<boolean | null> {
  const db = getDb();
  if (!db) return null;
  try {
    await db.insert(subscribers).values({ email: email.toLowerCase() }).onConflictDoNothing({ target: subscribers.email });
    return true;
  } catch (error) {
    console.error("[newsletter] Could not save the subscriber to the database", error);
    return false;
  }
}
