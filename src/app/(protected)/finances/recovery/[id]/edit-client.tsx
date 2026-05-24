"use client";

import { useActionState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateRecoverySession, ServiceState } from "@/lib/actions/services";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { RecoverySessionForm } from "@/components/finances/RecoverySessionForm";
import { ClubService } from "@/types";

export default function EditRecoverySessionClient({
  initialData,
  siteInventory,
}: {
  initialData: ClubService;
  siteInventory?: {
    compressors: number;
    attachments: {
      arms: number;
      legs: number;
      hips: number;
    };
  };
}) {
  const router = useRouter();
  const { idToken } = useAuth();

  const initialState: ServiceState = {
    message: "",
    success: false,
    errors: {},
  };

  const updateWithToken = async (
    prevState: ServiceState,
    formData: FormData
  ): Promise<ServiceState> => {
    if (!idToken) {
      return {
        success: false,
        message: "Няма валиден токен за оторизация.",
      };
    }
    return updateRecoverySession(initialData.id, idToken, prevState, formData);
  };

  const [state, formAction] = useActionState(updateWithToken, initialState);

  useEffect(() => {
    if (state?.message) {
      if (state.success) {
        toast.success("Готово!", { description: state.message });
        router.push("/catalogs?tab=recovery");
      } else {
        toast.error("Грешка", { description: state.message });
      }
    }
  }, [state, router]);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <PageHeader
        title="Редактиране на Процедура"
        description={`Редактиране на ${initialData.name}`}
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Каталози", href: "/catalogs" },
          { label: "Възстановяване", href: "/catalogs?tab=recovery" },
          { label: "Редактиране" },
        ]}
      />

      <div className="max-w-6xl">
        <RecoverySessionForm
          initialData={initialData}
          siteInventory={siteInventory}
          onSubmit={formAction}
          onCancel={() => router.back()}
          errors={state?.errors}
        />
      </div>
    </div>
  );
}
