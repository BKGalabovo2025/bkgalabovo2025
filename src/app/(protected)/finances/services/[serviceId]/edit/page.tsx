"use client";

import { useEffect, useState, useActionState } from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import { updateClubService, ServiceState } from "@/lib/actions/services";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { ServiceForm } from "@/components/finances/ServiceForm";
import { Service } from "../../service.types";
import { Loader2 } from "lucide-react";

export default function EditServicePage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.serviceId as string;
  const { idToken } = useAuth();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const initialState: ServiceState = {
    message: "",
    success: false,
    errors: {},
  };

  const updateServiceWithToken = async (
    prevState: ServiceState,
    formData: FormData
  ): Promise<ServiceState> => {
    if (!idToken) {
      return {
        success: false,
        message: "Няма валиден токен за оторизация. Моля, влезте отново.",
      };
    }
    return updateClubService(serviceId, idToken, prevState, formData);
  };

  const [state, formAction] = useActionState(
    updateServiceWithToken,
    initialState
  );

  useEffect(() => {
    if (!serviceId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/services/${serviceId}`);
        if (!response.ok) throw new Error("Failed to fetch service");
        const data = await response.json();
        setService(data);
      } catch (err) {
        setError(true);
        console.error(err);
      }
      setLoading(false);
    };

    fetchData();
  }, [serviceId]);

  useEffect(() => {
    if (state?.message) {
      if (state.success) {
        toast.success("Готово!", { description: state.message });
        router.push("/catalogs?tab=services");
      } else {
        toast.error("Грешка", { description: state.message });
      }
    }
  }, [state, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2
          className="h-10 w-10 animate-spin text-zinc-300"
          strokeWidth={1}
        />
        <p className="text-sm text-zinc-400 uppercase tracking-widest font-light">
          Зареждане на услуга...
        </p>
      </div>
    );
  }

  if (error || !service) {
    notFound();
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <PageHeader
        title="Редакция на Услуга"
        description={`Промяна на детайлите за "${service.name}"`}
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Каталози", href: "/catalogs" },
          { label: "Услуги", href: "/catalogs?tab=services" },
          { label: "Редакция" },
        ]}
      />

      <div className="max-w-6xl">
        <ServiceForm
          initialData={service}
          onSubmit={formAction}
          onCancel={() => router.back()}
          errors={state?.errors}
        />
      </div>
    </div>
  );
}
