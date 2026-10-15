/**
 * Reads a structured salary out of the free-text salary field, for Google for Jobs' `baseSalary`.
 * Only clear cases count: a currency, one or two amounts and a period ("PKR 80,000 – 120,000 per
 * month", "Rs 150k/month", "$40,000 - $55,000 a year"). Anything vaguer ("Based on experience",
 * "Negotiable") returns null, so nothing misleading reaches Google.
 */
export interface ParsedSalary {
  currency: "PKR" | "USD" | "EUR" | "GBP" | "AED" | "SAR";
  min: number;
  max?: number;
  unit: "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR";
}

const CURRENCIES: [RegExp, ParsedSalary["currency"]][] = [
  [/\b(pkr|rs\.?|rupees?)\b|₨/i, "PKR"],
  [/\busd\b|\$/i, "USD"],
  [/\beur\b|€/i, "EUR"],
  [/\bgbp\b|£/i, "GBP"],
  [/\baed\b|\bdirhams?\b/i, "AED"],
  [/\bsar\b|\briyals?\b/i, "SAR"],
];

const UNITS: [RegExp, ParsedSalary["unit"]][] = [
  [/\b(per\s+|an?\s+|\/\s*)?(hour|hr)\b|\bhourly\b/i, "HOUR"],
  [/\b(per\s+|a\s+|\/\s*)?day\b|\bdaily\b/i, "DAY"],
  [/\b(per\s+|a\s+|\/\s*)?week\b|\bweekly\b/i, "WEEK"],
  [/\b(per\s+|a\s+|\/\s*)?(month|mo)\b|\bmonthly\b|\bp\.?m\.?\b/i, "MONTH"],
  [/\b(per\s+|a\s+|\/\s*)?(year|yr|annum)\b|\b(yearly|annual(ly)?)\b|\bp\.?a\.?\b/i, "YEAR"],
];

const AMOUNT = /(\d[\d,]*(?:\.\d+)?)\s*(k|thousand|lacs?|lakhs?|m|million)?\b/gi;

function multiplier(suffix: string | undefined): number {
  const s = suffix?.toLowerCase();
  if (!s) return 1;
  if (s === "k" || s === "thousand") return 1_000;
  if (s.startsWith("lac") || s.startsWith("lakh")) return 100_000;
  return 1_000_000;
}

export function parseSalary(text: string | undefined | null): ParsedSalary | null {
  if (!text) return null;
  const currency = CURRENCIES.find(([re]) => re.test(text))?.[1];
  const unit = UNITS.find(([re]) => re.test(text))?.[1];
  if (!currency || !unit) return null;
  const amounts = [...text.matchAll(AMOUNT)]
    .map((m) => Number(m[1].replace(/,/g, "")) * multiplier(m[2]))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (amounts.length === 0 || amounts.length > 2) return null;
  const [a, b] = amounts;
  if (b === undefined) return { currency, min: a, unit };
  return a <= b ? { currency, min: a, max: b, unit } : null;
}
