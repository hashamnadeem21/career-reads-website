/** The same lists the API accepts (blognest-api `company-requests.schemas.ts`); keep them in step. */
export const INDUSTRIES = [
  "Software & IT",
  "Finance & Banking",
  "Healthcare",
  "Education",
  "Marketing & Advertising",
  "Retail & E-commerce",
  "Manufacturing",
  "Telecommunications",
  "Consulting & Professional Services",
  "Government & Non-profit",
  "Other",
] as const;

export const COMPANY_SIZES = [
  { value: "1-10", label: "1–10 people" },
  { value: "11-50", label: "11–50 people" },
  { value: "51-200", label: "51–200 people" },
  { value: "201-1000", label: "201–1,000 people" },
  { value: "1000+", label: "More than 1,000 people" },
] as const;
