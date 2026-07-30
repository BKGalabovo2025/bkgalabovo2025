import { z } from "zod";

import { MemberSchema } from "@/types/member.types";

export const MemberFormSchema = MemberSchema.omit({
  id: true,
  name: true,
  registrationDate: true,
  updatedAt: true,
}).extend({
  registrationDate: z.string().optional(),
});

export type MemberFormValues = z.infer<typeof MemberFormSchema>;
