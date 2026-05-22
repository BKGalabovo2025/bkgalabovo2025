import { MemberSchema } from "@/types/member.types";

export const validateMemberData = (data: unknown) => {
  return MemberSchema.safeParse(data);
};

export default { validateMemberData };
