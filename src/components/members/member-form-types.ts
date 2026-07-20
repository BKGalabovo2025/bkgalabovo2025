import { MemberSchema } from "@/types/member.types";
import { z } from "zod";

export const MemberFormSchema = MemberSchema.omit({
  id: true,
  name: true,
  registrationDate: true,
  updatedAt: true,
}).extend({
  registrationDate: z.string().optional(),
});

export type MemberFormValues = z.infer<typeof MemberFormSchema>;
