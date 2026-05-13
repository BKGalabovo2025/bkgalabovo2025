"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { createMemberAction } from "@/lib/actions/members";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { MemberForm } from "@/components/members/member-form";
import { Member } from "@/types/member.types";

type MemberFormValues = Omit<
  Member,
  "id" | "name" | "registrationDate" | "updatedAt"
>;

const NewMemberPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const familyId = searchParams.get("familyId");
  const { idToken } = useAuth();

  const handleSave = async (data: MemberFormValues) => {
    if (!idToken) {
      toast.error("Грешка при оторизация", {
        description: "Моля, влезте отново в профила си.",
      });
      return;
    }

    try {
      const result = await createMemberAction(idToken, data);

      if (result.success) {
        toast.success("Успех!", { description: result.message });
        router.push(`/members/${result.data?.id}`);
        router.refresh();
      } else {
        toast.error("Грешка", { description: result.message });
        if (result.errors) {
          console.error("Validation errors:", result.errors);
        }
      }
    } catch (e) {
      console.error("Failed to create member:", e);
      toast.error("Грешка", {
        description: "Неуспешно свързване със сървъра.",
      });
    }
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-4">Добавяне на нов член</h1>
      <MemberForm
        onSave={handleSave}
        onClose={handleClose}
        initialData={familyId ? ({ familyId } as any) : undefined}
      />
    </div>
  );
};

export default NewMemberPage;
