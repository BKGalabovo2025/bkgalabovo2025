"use client";

import { useRouter } from "next/navigation";
import { addMember } from "@/services/member-service";
import { toast } from "sonner";
import { MemberForm, MemberFormValues } from "@/components/members/member-form";
import { Member } from "@/types/member.types";

const NewMemberPage = () => {
  const router = useRouter();

  const handleSave = async (data: MemberFormValues) => {
    try {
      const newMemberId = await addMember(data as any);
      toast.success("Успех!", { description: "Нов член е добавен успешно." });
      router.push(`/members/${newMemberId}`);
      router.refresh(); // Refresh the members list page
    } catch (e) {
      console.error("Failed to create member:", e);
      toast.error("Грешка", { description: "Неуспешно създаване на член." });
    }
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-4">Добавяне на нов член</h1>
      <MemberForm onSave={handleSave} onClose={handleClose} />
    </div>
  );
};

export default NewMemberPage;
