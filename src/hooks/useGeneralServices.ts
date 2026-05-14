import { useState, useEffect, useCallback } from "react";
import { onSnapshot } from "firebase/firestore";
import { GeneralService } from "@/types";
import { toast } from "sonner";
import { deleteGeneralService } from "@/lib/actions/general-services";
import { getGeneralServicesQuery } from "@/lib/firebase-collections";
import { useAppStore } from "@/store/use-app-store";

export const useGeneralServices = () => {
  const [services, setServices] = useState<GeneralService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { activeBranch } = useAppStore();

  useEffect(() => {
    const q = getGeneralServicesQuery();

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const servicesData = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as GeneralService[];
        setServices(servicesData);
        setIsLoading(false);
      },
      (err) => {
        console.error("Error fetching general services:", err);
        setError(err);
        setIsLoading(false);
        toast.error("Грешка при зареждане на услугите");
      }
    );

    return () => unsubscribe();
  }, [activeBranch]);

  const deleteService = useCallback(async (id: string, idToken: string) => {
    try {
      const result = await deleteGeneralService(idToken, id);
      if (result.success) {
        toast.success("Услугата е изтрита");
      } else {
        toast.error(result.message || "Грешка при изтриване");
      }
    } catch (err) {
      console.error("Error deleting service:", err);
      toast.error("Грешка при изтриване");
      throw err;
    }
  }, []);

  return {
    services,
    isLoading,
    error,
    deleteService,
  };
};
