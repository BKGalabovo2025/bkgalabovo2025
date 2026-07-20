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
import { marketingService } from "@/services/marketing-service";

export function useReservationSubmit(
  isRecoveryZone: boolean,
  activeBranch: string,
  price: number,
  services: ClubService[],
  packageDays: PackageDay[],
  reservation: Reservation | undefined,
  applyPaymentToPackage: boolean,
  onSave: (() => void) | undefined,
  setIsOpen: (isOpen: boolean) => void
) {
  const [isSaving, setIsSaving] = useState(false);
  const { getFreshToken, user } = useAuth();
  const isEditMode = !!reservation;

  const submitPackageCreate = async (
    token: string,
    values: ReservationFormValues,
    selectedService: ClubService | undefined
  ) => {
    const allReservations = packageDays.map((pd) => {
      const finalResources = buildFinalResources(
        isRecoveryZone,
        selectedService,
        pd.client1Zone,
        pd.client2Zone
      );
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
          pd.client2Zone
        ),
        client2Name: values.client2Name,
        client2Phone: values.client2Phone,
        status: values.status || "unpaid",
        paymentMethod: values.paymentMethod || "Cash",
      };
    });
    return createPackageReservationsAction(
      token,
      allReservations,
      values.paymentMethod || "Cash"
    );
  };

  const submitSingleCreate = async (
    token: string,
    values: ReservationFormValues,
    selectedService: ClubService | undefined
  ) => {
    const finalResources = buildFinalResources(
      isRecoveryZone,
      selectedService,
      values.selectedZone,
      values.client2Zone
    );
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
      values.client2Zone
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
    selectedService: ClubService | undefined
  ) => {
    if (!reservation) return null;

    const finalResources = buildFinalResources(
      isRecoveryZone,
      selectedService,
      values.selectedZone,
      values.client2Zone
    );
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
      values.client2Zone
    );

    const statusChanged = values.status !== reservation.status;
    const newStatus =
      reservation.packageGroupId && applyPaymentToPackage && statusChanged
        ? reservation.status
        : values.status || "unpaid";

    let result = await updateReservationAction(token, reservation.id, {
      ...dataToSave,
      status: newStatus,
      paymentMethod: values.paymentMethod || "Cash",
    });

    if (result.success && reservation.packageGroupId) {
      const packagePatch =
        applyPaymentToPackage && statusChanged
          ? {
              status: values.status || "unpaid",
              paymentMethod: values.paymentMethod || "Cash",
            }
          : {};
      result = await updatePackageReservationsAction(
        token,
        reservation.packageGroupId,
        {
          ...dataToSave,
          ...packagePatch,
        }
      );
    }
    return result;
  };

  const sendConfirmationEmail = (
    values: ReservationFormValues,
    token: string,
    selectedService: { name?: string } | undefined
  ) => {
    if (!values.clientEmail) {
      toast.error("Не е посочен имейл адрес за потвърждение.");
      return;
    }
    if (!values.startTime || !values.endTime) {
      toast.error("Липсва време за резервацията.");
      return;
    }

    const loc = isRecoveryZone
      ? selectedService?.name || "Услуга"
      : `Корт ${values.courtId}`;
    const date = values.startTime.toLocaleDateString("bg-BG");
    const startStr = values.startTime.toLocaleTimeString("bg-BG", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const endStr = values.endTime.toLocaleTimeString("bg-BG", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const text = `Здравейте, ${values.clientName}!\n\nУспешно запазихте час на ${date} от ${startStr} до ${endStr} за ${loc}.\nОчакваме Ви!`;

    fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: values.clientEmail,
        subject: "Потвърждение за резервация",
        template: "reservationConfirmation",
        data: {
          clientName: values.clientName,
          messageText: text,
          startTime: values.startTime.toISOString(),
          endTime: values.endTime.toISOString(),
          courtId: loc,
          isRecoveryZone: isRecoveryZone,
        },
      }),
    })
      .then(async (res) => {
        if (res.ok) {
          toast.success("Имейлът с потвърждение е изпратен автоматично!");
          if (values.memberId && user) {
            const logData = {
              siteId: activeBranch,
              recipientId: values.memberId,
              recipientName: values.clientName,
              recipientPhone: values.clientEmail,
              messageText: `Тема: Потвърждение за резервация\n\n${text}`,
              templateUsed: "reservationConfirmation",
              sentBy: user.uid,
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await marketingService.logMessage(logData as any);
          }
        } else {
          const errorData = await res.json().catch(() => ({}));
          toast.error(errorData.error || "Грешка при изпращане на имейл.");
        }
      })
      .catch(() => {
        toast.error("Възникна мрежова грешка при изпращане на имейла.");
      });
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

        if (values.sendConfirmation) {
          sendConfirmationEmail(values, token, selectedService);
        }
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
