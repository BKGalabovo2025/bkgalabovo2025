"use client";

import { useActionState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClubService, ServiceState } from "@/lib/actions/services";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { ServiceForm } from "@/components/finances/ServiceForm";

export default function NewServicePage() {
  const router = useRouter();
  const { idToken } = useAuth();

  const initialState: ServiceState = {
    message: "",
    success: false,
    errors: {},
  };

  const createServiceWithToken = async (
    prevState: ServiceState,
    formData: FormData
  ): Promise<ServiceState> => {
    if (!idToken) {
      return {
        success: false,
        message: "Няма валиден токен за оторизация. Моля, влезте отново.",
      };
    }
    return createClubService(idToken, prevState, formData);
  };

  const [state, formAction] = useActionState(
    createServiceWithToken,
    initialState
  );

  useEffect(() => {
    if (state?.message) {
      if (state.success) {
        toast.success("Готово!", { description: state.message });
        router.push("/finances/services");
      } else {
        toast.error("Грешка", { description: state.message });
      }
    }
  }, [state, router]);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <PageHeader
        title="Нова Услуга"
        description="Добавяне на нов абонаментен план или индивидуална тренировка към каталога."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Каталози", href: "/finances" },
          { label: "Услуги", href: "/finances/services" },
          { label: "Нова услуга" },
        ]}
      />

      <div className="max-w-6xl">
        <ServiceForm
          onSubmit={formAction}
          onCancel={() => router.back()}
          errors={state?.errors}
        />
      </div>
    </div>
  );
}
