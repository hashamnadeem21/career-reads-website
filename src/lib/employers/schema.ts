import { z } from "zod";
import { COMPANY_SIZES, INDUSTRIES } from "./options";

const text = (min: number, max: number, required: string) =>
  z.string().trim().min(min, required).max(max, `Keep it under ${max} characters`);

/** The "For employers" form, checked here first; the API checks everything again. */
export const companyRequestSchema = z.object({
  companyName: text(2, 100, "Enter your company's name"),
  website: z
    .string()
    .trim()
    .max(300)
    .transform((v) => (v && !/^https?:\/\//i.test(v) ? `https://${v}` : v) || undefined)
    .pipe(z.url("Enter your website, like https://company.com").optional()),
  industry: z.enum(INDUSTRIES, { error: "Choose your industry" }),
  companySize: z.enum(COMPANY_SIZES.map((s) => s.value) as [string, ...string[]], { error: "Choose your company's size" }),
  location: text(2, 100, "Enter your city and country"),
  contactName: text(2, 80, "Enter your full name"),
  contactRole: text(2, 80, "Enter your job title"),
  contactEmail: z.string().trim().toLowerCase().max(200).pipe(z.email("Enter a valid work email")),
  contactPhone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s()-]{6,25}$/, "Enter a phone number, like +92 300 1234567"),
  hiringPlans: z
    .string()
    .trim()
    .max(2000, "Keep it under 2,000 characters")
    .optional()
    .transform((v) => v || undefined),
  consent: z.literal("on", { error: "Please agree to continue" }).transform(() => true as const),
  startedAt: z.coerce.number().int().nonnegative().optional(),
});
export type CompanyRequestForm = z.infer<typeof companyRequestSchema>;

export const COMPANY_REQUEST_FIELDS = [
  "companyName",
  "website",
  "industry",
  "companySize",
  "location",
  "contactName",
  "contactRole",
  "contactEmail",
  "contactPhone",
  "hiringPlans",
] as const;
