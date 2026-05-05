"use client";

import { useParams, useRouter } from "next/navigation";
import { useMembers } from "@/hooks/useMembers";
import { updateMember } from "@/services/member-service";
import { toast } from "sonner";
import { MemberForm } from "@/components/members/member-form";
import { Loader2, AlertCircle } from "lucide-react";
import { Member } from "@/types/member.types";

type MemberFormValues = Omit<
  Member,
  "id" | "name" | "registrationDate" | "updatedAt"
>;

const EditMemberPage = () => {
  const router = useRouter();
  const params = useParams();
  const memberId = params.id as string;

  const { members, loading, error } = useMembers();
  const member = members.find((m) => m.id === memberId);

  const handleSave = async (data: MemberFormValues) => {
    try {
      await updateMember(memberId, data);
      toast.success("Успех!", {
        description: "Членът е актуализиран успешно.",
      });
      router.push(`/members/${memberId}`);
      router.refresh(); // Force a refresh to reflect changes
    } catch {
      toast.error("Грешка", {
        description: "Неуспешно актуализиране на члена.",
      });
    }
  };

  const handleClose = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-destructive">
        <AlertCircle className="h-12 w-12 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Грешка при зареждане</h2>
        <p>{error || "Членът не е намерен"}</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-4">Редактиране на член</h1>
      <MemberForm
        initialData={member}
        onSave={handleSave}
        onClose={handleClose}
      />
    </div>
  );
};

export default EditMemberPage;
