"use client";

import { AlertCircle, ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { MemberForm } from "@/components/members/member-form";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useMemberProfile } from "@/hooks/useMemberProfile";
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

  const { member, loading, error, refetch } = useMemberProfile(memberId);
  const { idToken, getFreshToken } = useAuth();

  const handleSave = async (data: MemberFormValues) => {
    let token = idToken;
    if (!token) {
      token = await getFreshToken();
    }
    if (!token) {
      toast.error("Грешка при автентикация", {
        description:
          "Моля, опреснете страницата или влезте отново в профила си.",
      });
      return;
    }

    try {
      const result = await updateMemberAction(memberId, token, data);
      if (result.success) {
        toast.success("Успех!", {
          description: result.message || "Членът е актуализиран успешно.",
        });
        await refetch();
        router.push(`/members/${memberId}`);
        router.refresh();
      } else {
        toast.error("Грешка при запис", {
          description: result.message || "Неуспешно актуализиране на члена.",
        });
      }
    } catch (err) {
      toast.error("Грешка", {
        description:
          err instanceof Error
            ? err.message
            : "Неуспешно актуализиране на члена.",
      });
    }
  };

  const handleClose = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="flex h-[calc(100vh-200px)] flex-col items-center justify-center text-destructive">
        <AlertCircle className="mb-4 size-12" />
        <h2 className="mb-2 text-xl font-semibold">Грешка при зареждане</h2>
        <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
          {error || "Членът с това ID не е намерен или нямате достъп."}
        </p>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="size-4" /> Назад
          </Button>
          <Button
            variant="default"
            onClick={() => refetch()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="size-4" /> Опитай отново
          </Button>
        </div>
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
