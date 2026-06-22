import { useMemo, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { ClubService } from "@/types";
import { ReservationFormValues } from "../ReservationDialogContext";

export function useReservationPricing(
  form: UseFormReturn<ReservationFormValues>,
  watchedValues: ReservationFormValues,
  services: ClubService[],
  isRecoveryZone: boolean,
  courtRentalPrice: number
) {
  // Auto-set end time for recovery services based on duration
  useEffect(() => {
    if (isRecoveryZone && watchedValues.serviceId && watchedValues.startTime) {
      const selectedService = services.find((s) => s.id === watchedValues.serviceId);
      if (selectedService?.durationMinutes) {
        const newEndTime = new Date(
          watchedValues.startTime.getTime() + selectedService.durationMinutes * 60000
        );
        if (!watchedValues.endTime || watchedValues.endTime.getTime() !== newEndTime.getTime()) {
          form.setValue("endTime", newEndTime);
        }
      }
    }
  }, [watchedValues.serviceId, watchedValues.startTime, isRecoveryZone, services, form, watchedValues.endTime]);

  const isTwoClients = useMemo(() => {
    const s = services.find((s) => s.id === watchedValues.serviceId);
    if (!s?.name) return false;
    const name = s.name.toLowerCase();
    return name.includes("двама") || name.includes("2-ма") || name.includes("2ма");
  }, [services, watchedValues.serviceId]);

  const price = useMemo(() => {
    if (isRecoveryZone) {
      const selectedService = services.find((s) => s.id === watchedValues.serviceId);
      return selectedService?.price || 0;
    }
    if (watchedValues.startTime && watchedValues.endTime && watchedValues.endTime > watchedValues.startTime) {
      const durationHours = (watchedValues.endTime.getTime() - watchedValues.startTime.getTime()) / (1000 * 60 * 60);
      return durationHours * courtRentalPrice;
    }
    return 0;
  }, [watchedValues.startTime, watchedValues.endTime, watchedValues.serviceId, isRecoveryZone, services, courtRentalPrice]);

  const groupedServices = useMemo(() => {
    const groups: { [key: string]: ClubService[] } = {};
    services.forEach((s) => {
      const cat = s.category || "Други";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s);
    });
    return groups;
  }, [services]);

  return {
    isTwoClients,
    price,
    groupedServices,
  };
}
