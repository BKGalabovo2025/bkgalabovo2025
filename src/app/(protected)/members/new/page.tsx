"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { GenerateDocumentLinkDialog } from "@/components/members/GenerateDocumentLinkDialog";
import { MemberForm } from "@/components/members/member-form";
import { useAuth } from "@/context/auth-context";
import { createMemberAction } from "@/lib/actions/members";
import { Member } from "@/types/member.types";

type MemberFormValues = Omit<
  Member,
  "id" | "name" | "registrationDate" | "updatedAt"
>;

function NewMemberContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const familyId = searchParams.get("familyId");
  const type = searchParams.get("type");
  const { idToken } = useAuth();
  const [createdMember, setCreatedMember] = useState<Member | null>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);

  const handleSave = async (data: MemberFormValues) => {
    if (!idToken) {
      toast.error("Грешка при оторизация", {
        description: "Моля, влезте отново в профила си.",
      });
      return;
    }

    try {
      const result = await createMemberAction(idToken, data);

      if (result.success && result.data?.id) {
        toast.success("Членът е записан успешно!");
        if (type === "guest") {
          router.push(`/members/${result.data.id}`);
          router.refresh();
        } else {
          const newMem = {
            id: result.data.id,
            ...data,
          } as unknown as Member;
          setCreatedMember(newMem);
          setShowLinkDialog(true);
        }
      } else {
        toast.error("Грешка", { description: result.message });
        if (result.errors) {
          console.error("Validation errors:", result.errors);
        }
      }
    } catch (e: unknown) {
      console.error("Failed to create member:", e);
      toast.error("Грешка", {
        description: "Неуспешно свързване със сървъра.",
      });
    }
  };

  const handleLinkDialogClose = (open: boolean) => {
    setShowLinkDialog(open);
    if (!open && createdMember) {
      router.push(`/members/${createdMember.id}`);
      router.refresh();
    }
  };

  const handleClose = () => {
    router.back();
  };

  const initialData: Partial<Member> = {};
  if (familyId) {
    initialData.familyId = familyId;
  }
  if (type === "guest") {
    initialData.isGuest = true;
    initialData.isClubMember = false;
    initialData.isRecoveryMember = false;
    initialData.memberType = "guest";
  } else if (type === "recovery") {
    initialData.isRecoveryMember = true;
    initialData.isClubMember = false;
    initialData.isGuest = false;
    initialData.memberType = "recovery";
  }

  const pageTitle =
    type === "guest"
      ? "Добавяне на външен клиент (гост)"
      : type === "recovery"
        ? "Добавяне на клиент за възстановяване"
        : "Добавяне на нов член";

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title={pageTitle}
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Членове", href: "/members" },
          { label: "Нов член" },
        ]}
      />
      <MemberForm
        onSave={handleSave}
        onClose={handleClose}
        initialData={initialData}
      />

      {createdMember && (
        <GenerateDocumentLinkDialog
          member={createdMember}
          documentType="membershipApplication"
          open={showLinkDialog}
          onOpenChange={handleLinkDialogClose}
        />
      )}
    </div>
  );
}

const NewMemberPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      }
    >
      <NewMemberContent />
    </Suspense>
  );
};

export default NewMemberPage;
