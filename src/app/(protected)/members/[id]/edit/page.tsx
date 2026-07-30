"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { MemberForm } from "@/components/members/member-form";
import { useAuth } from "@/context/auth-context";
import { useMembers } from "@/hooks/useMembers";
import { updateMemberAction } from "@/lib/actions/members";
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
  const { idToken } = useAuth();
  const member = members.find((m) => m.id === memberId);

  const handleSave = async (data: MemberFormValues) => {
    if (!idToken) return;
    try {
      const result = await updateMemberAction(memberId, idToken, data);
      if (result.success) {
        toast.success("Успех!", {
          description: result.message || "Членът е актуализиран успешно.",
        });
        router.push(`/members/${memberId}`);
        router.refresh();
      } else {
        toast.error("Грешка", {
          description: result.message || "Неуспешно актуализиране на члена.",
        });
      }
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
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-12 animate-spin" />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="flex h-[calc(100vh-200px)] flex-col items-center justify-center text-destructive">
        <AlertCircle className="mb-4 size-12" />
        <h2 className="mb-2 text-xl font-semibold">Грешка при зареждане</h2>
        <p>{error || "Членът не е намерен"}</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-2xl font-bold">Редактиране на член</h1>
      <MemberForm
        initialData={member}
        onSave={handleSave}
        onClose={handleClose}
      />
    </div>
  );
};

export default EditMemberPage;
