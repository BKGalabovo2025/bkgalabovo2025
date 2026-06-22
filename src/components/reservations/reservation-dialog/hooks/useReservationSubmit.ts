import { useState } from "react";
import { toast } from "sonner";
import { ClubService, Reservation } from "@/types";
import { ReservationFormValues, PackageDay } from "../ReservationDialogContext";
import { buildFinalResources, buildBasePayload } from "./utils";
import {
  createReservationAction,
  updateReservationAction,
  createPackageReservationsAction,
  updatePackageReservationsAction,
} from "@/lib/actions/reservations";
import { useAuth } from "@/context/auth-context";

export function useReservationSubmit(
  isRecoveryZone: boolean,
  activeBranch: string,
  price: number,
  services: ClubService[],
  packageDays: PackageDay[],
  reservation: Reservation | undefined,
  applyPaymentToPackage: boolean,
  onSave: (() => void) | undefined,
  setIsOpen: (isOpen: boolean) => void,
) {
  const [isSaving, setIsSaving] = useState(false);
  const { getFreshToken } = useAuth();
  const isEditMode = !!reservation;

  const submitPackageCreate = async (
    token: string,
    values: ReservationFormValues,
    selectedService: ClubService | undefined,
  ) => {
    const allReservations = packageDays.map((pd) => {
      const finalResources = buildFinalResources(isRecoveryZone, selectedService, pd.client1Zone, pd.client2Zone);
      return {
        ...buildBasePayload(
          isRecoveryZone,
          activeBranch,
          price,
          values,
          selectedService,
          pd.startTime?.toISOString(),
          pd.endTime?.toISOString(),
          finalResources,
          pd.client1Zone,
          pd.client2Zone,
        ),
        client2Name: values.client2Name,
        client2Phone: values.client2Phone,
        status: values.status || "unpaid",
        paymentMethod: values.paymentMethod || "Cash",
      };
    });
    return createPackageReservationsAction(token, allReservations, values.paymentMethod || "Cash");
  };

  const submitSingleCreate = async (
    token: string,
    values: ReservationFormValues,
    selectedService: ClubService | undefined,
  ) => {
    const finalResources = buildFinalResources(isRecoveryZone, selectedService, values.selectedZone, values.client2Zone);
    const dataToSave = buildBasePayload(
      isRecoveryZone,
      activeBranch,
      price,
      values,
      selectedService,
      values.startTime?.toISOString(),
      values.endTime?.toISOString(),
      finalResources,
      values.selectedZone,
      values.client2Zone,
    );
    return createReservationAction(token, {
      ...dataToSave,
      status: values.status || "unpaid",
      paymentMethod: values.paymentMethod || "Cash",
    });
  };

  const submitEdit = async (
    token: string,
    values: ReservationFormValues,
    selectedService: ClubService | undefined,
  ) => {
    if (!reservation) return null;

    const finalResources = buildFinalResources(isRecoveryZone, selectedService, values.selectedZone, values.client2Zone);
    const dataToSave = buildBasePayload(
      isRecoveryZone,
      activeBranch,
      price,
      values,
      selectedService,
      values.startTime?.toISOString(),
      values.endTime?.toISOString(),
      finalResources,
      values.selectedZone,
      values.client2Zone,
    );

    const statusChanged = values.status !== reservation.status;
    const newStatus = reservation.packageGroupId && applyPaymentToPackage && statusChanged
      ? reservation.status
      : values.status || "unpaid";

    let result = await updateReservationAction(token, reservation.id, {
      ...dataToSave,
      status: newStatus,
      paymentMethod: values.paymentMethod || "Cash",
    });

    if (result.success && reservation.packageGroupId) {
      const packagePatch = applyPaymentToPackage && statusChanged
        ? { status: values.status || "unpaid", paymentMethod: values.paymentMethod || "Cash" }
        : {};
      result = await updatePackageReservationsAction(token, reservation.packageGroupId, {
        ...dataToSave,
        ...packagePatch,
      });
    }
    return result;
  };

  const onSubmit = async (values: ReservationFormValues) => {
    const token = await getFreshToken(true);
    if (!token) {
      toast.error("Грешка при оторизация");
      return;
    }

    setIsSaving(true);
    try {
      const selectedService = services.find((s) => s.id === values.serviceId);
      let result;

      if (packageDays.length > 0 && !isEditMode) {
        result = await submitPackageCreate(token, values, selectedService);
      } else if (isEditMode) {
        result = await submitEdit(token, values, selectedService);
      } else {
        result = await submitSingleCreate(token, values, selectedService);
      }

      if (result?.success) {
        toast.success(result.message);
        onSave?.();
        setIsOpen(false);
      } else {
        toast.error("Грешка", { description: result?.message });
      }
    } catch (error) {
      console.error("Failed to save reservation:", error);
      toast.error("Възникна системна грешка при запазването.");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    onSubmit,
  };
}
