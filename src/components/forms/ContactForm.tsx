"use client";

import { CheckCircle2, Loader2, Send } from "lucide-react";
import { useActionState, useId } from "react";
import { sendContactMessage } from "@/app/actions";
import { initialFormState } from "@/lib/forms/form-state";
import { cn } from "@/lib/utils";
import { FieldError, SpamGuardFields, useTimedAction } from "./SpamGuardFields";

const topics = [
  { value: "general", label: "General question" },
  { value: "feedback", label: "Feedback on an article" },
  { value: "correction", label: "Report an error / correction" },
  { value: "advertising", label: "Advertising" },
  { value: "partnership", label: "Partnership" },
];

const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30 aria-[invalid=true]:border-rose-500";

export function ContactForm() {
  const [state, formAction, pending] = useActionState(sendContactMessage, initialFormState);
  const timedAction = useTimedAction(formAction);
  const id = useId();
  const errors = state.fieldErrors ?? {};
  const values = state.values ?? {};

  if (state.status === "success") {
    return (
      <div role="status" className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
        <p className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-5 w-5" aria-hidden /> Message sent
        </p>
        <p className="mt-2 text-sm text-muted">{state.message}</p>
      </div>
    );
  }

  const field = (name: string) => ({
    id: `${id}-${name}`,
    name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${id}-${name}-error` : undefined,
  });

  return (
    <form action={timedAction} noValidate className="relative space-y-5" data-testid="contact-form">
      <SpamGuardFields />
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-name`} className="mb-1.5 block text-sm font-medium">
            Name
          </label>
          <input {...field("name")} type="text" autoComplete="name" required defaultValue={values.name} className={inputClass} />
          <FieldError id={`${id}-name-error`} errors={errors.name} />
        </div>
        <div>
          <label htmlFor={`${id}-email`} className="mb-1.5 block text-sm font-medium">
            Email
          </label>
          <input {...field("email")} type="email" autoComplete="email" required defaultValue={values.email} className={inputClass} />
          <FieldError id={`${id}-email-error`} errors={errors.email} />
        </div>
      </div>
      <div>
        <label htmlFor={`${id}-topic`} className="mb-1.5 block text-sm font-medium">
          Topic
        </label>
        <select {...field("topic")} defaultValue={values.topic ?? "general"} className={inputClass}>
          {topics.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <FieldError id={`${id}-topic-error`} errors={errors.topic} />
      </div>
      <div>
        <label htmlFor={`${id}-message`} className="mb-1.5 block text-sm font-medium">
          Message
        </label>
        <textarea {...field("message")} rows={6} required defaultValue={values.message} className={cn(inputClass, "resize-y")} />
        <FieldError id={`${id}-message-error`} errors={errors.message} />
      </div>
      {state.status === "error" && (
        <p role="alert" className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-brand to-brand-2 px-7 font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:brightness-110 disabled:opacity-70"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
        {pending ? "Sending…" : "Send message"}
      </button>
      <p className="text-xs text-muted">
        We use your details only to reply to your message. They are not added to any mailing list.
      </p>
    </form>
  );
}
