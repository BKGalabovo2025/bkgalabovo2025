"use client";

import { useActionState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createRecoverySession, ServiceState } from "@/lib/actions/services";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { RecoverySessionForm } from "@/components/finances/RecoverySessionForm";

interface NewRecoverySessionClientProps {
  siteInventory?: {
    compressors: number;
    attachments: {
      arms: number;
      legs: number;
      hips: number;
    };
  };
}

export default function NewRecoverySessionClient({
  siteInventory,
}: NewRecoverySessionClientProps) {
  const router = useRouter();
  const { idToken } = useAuth();

  const initialState: ServiceState = {
    message: "",
    success: false,
    errors: {},
  };

  const createWithToken = async (
    prevState: ServiceState,
    formData: FormData
  ): Promise<ServiceState> => {
    if (!idToken) {
      return {
        success: false,
        message: "Няма валиден токен за оторизация.",
      };
    }
    return createRecoverySession(idToken, prevState, formData);
  };

  const [state, formAction] = useActionState(createWithToken, initialState);

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
    <div className="space-y-12 duration-700 animate-in fade-in">
      <PageHeader
        title="Нова Процедура"
        description="Добавяне на нова процедура за възстановяване към каталога."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Каталози", href: "/catalogs" },
          { label: "Възстановяване", href: "/catalogs?tab=recovery" },
          { label: "Нова процедура" },
        ]}
      />

      <div className="max-w-6xl">
        <RecoverySessionForm
          siteInventory={siteInventory}
          onSubmit={formAction}
          onCancel={() => router.back()}
          errors={state?.errors}
        />
      </div>
    </div>
  );
}
