import { z } from "zod";

export const siteIdSchema = z.enum(["bkgalabovo", "recoveryzone"]);
export const docIdSchema = z.string().trim().min(1).max(128);
export const nonEmptyTextSchema = z.string().trim().min(1).max(500);
export const optionalNotesSchema = z
  .string()
  .trim()
  .max(4000)
  .optional()
  .nullable();

export function parseActionInput<T>(
  schema: z.ZodType<T>,
  input: unknown
): { ok: true; data: T } | { ok: false; error: string } {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message || "Невалидни входни данни.",
    };
  }
  return { ok: true, data: parsed.data };
}
