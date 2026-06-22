import { useState } from "react";
import { toast } from "sonner";
import { UseFormReturn } from "react-hook-form";
import { ClubService } from "@/types";
import { Site } from "@/types/site.types";
import { ReservationFormValues, Step, PackageDay } from "../ReservationDialogContext";
import {
  detectPackageInfo,
  buildZoneResources,
  buildPackageDays,
  toUtcIso,
  checkWorkingHoursLogic,
} from "./utils";
import { checkRecoveryInventoryAction } from "@/lib/actions/reservations";

export function useReservationNavigation(
  form: UseFormReturn<ReservationFormValues>,
  watchedValues: ReservationFormValues,
  services: ClubService[],
  siteInfo: Site | null,
  isRecoveryZone: boolean,
  isTwoClients: boolean,
  ignoreWorkingHoursWarning: boolean,
) {
  const [currentStep, setCurrentStep] = useState<Step>("time");
  const [packageDays, setPackageDays] = useState<PackageDay[]>([]);

  const checkWorkingHours = (date: Date): string | null => {
    return checkWorkingHoursLogic(date, siteInfo);
  };

  const buildTimeStepFields = (
    isPackage: boolean,
    selectedService: ClubService | undefined,
  ): Array<keyof ReservationFormValues> => {
    const fields: Array<keyof ReservationFormValues> = [];
    if (!isPackage) fields.push("startTime", "endTime");
    if (!isRecoveryZone) {
      fields.push("courtId");
    } else {
      fields.push("serviceId");
      if (selectedService && (selectedService.zones?.length || 0) > 1 && !isPackage) {
        fields.push("selectedZone");
      }
    }
    return fields;
  };

  const checkInventoryForTimeStep = async (): Promise<boolean> => {
    if (!watchedValues.startTime || !watchedValues.endTime) return true;

    const resources = buildZoneResources(
      watchedValues.selectedZone,
      isTwoClients ? watchedValues.client2Zone : undefined,
    );
    if (!resources) return true;

    const inventoryCheck = await checkRecoveryInventoryAction(
      "recoveryzone",
      toUtcIso(watchedValues.startTime),
      toUtcIso(watchedValues.endTime),
      { compressors: resources.compressors, attachments: resources.attachments },
    );
    if (!inventoryCheck.success) {
      toast.error(inventoryCheck.message);
      return false;
    }
    return true;
  };

  const navigateAfterTimeStep = (
    isPackage: boolean,
    daysCount: number,
    selectedService: ClubService | undefined,
  ) => {
    if (!isPackage || daysCount <= 1) {
      setCurrentStep("details");
      return;
    }
    const baseStart = watchedValues.startTime || new Date();
    const fallbackDuration = (selectedService?.durationMinutes || 60) * 60000;
    const baseEnd = watchedValues.endTime || new Date(baseStart.getTime() + fallbackDuration);
    setPackageDays(buildPackageDays(daysCount, baseStart, baseEnd, watchedValues.selectedZone, watchedValues.client2Zone));
    setCurrentStep("packageDays");
  };

  const handleNextTimeStep = async (): Promise<boolean> => {
    const selectedService = services.find((s) => s.id === watchedValues.serviceId);
    const { isPackage, daysCount } = detectPackageInfo(selectedService);

    const isValid = await form.trigger(buildTimeStepFields(isPackage, selectedService));
    if (!isValid) {
      if (form.formState.errors.endTime) toast.error("Крайният час е невалиден.");
      else toast.error("Моля, попълнете всички задължителни полета.");
      return false;
    }

    if (watchedValues.startTime) {
      const warning = checkWorkingHours(watchedValues.startTime);
      if (warning && !ignoreWorkingHoursWarning) {
        toast.error(warning, { duration: 5000 });
        return false;
      }
    }

    if (isRecoveryZone) {
      const passed = await checkInventoryForTimeStep();
      if (!passed) return false;
    }

    navigateAfterTimeStep(isPackage, daysCount, selectedService);
    return true;
  };

  const checkInventoryForPackageDay = async (p: PackageDay): Promise<boolean> => {
    const resources = buildZoneResources(
      p.client1Zone,
      isTwoClients ? p.client2Zone : undefined,
    );

    if (!p.client1Zone) {
      toast.error(`Ден ${p.dayIndex + 1}: Моля, изберете зона за Клиент 1.`);
      return false;
    }
    if (isTwoClients && !p.client2Zone) {
      toast.error(`Ден ${p.dayIndex + 1}: Моля, изберете зона за Клиент 2.`);
      return false;
    }

    if (!p.startTime || !p.endTime || !resources) return true;

    const inventoryCheck = await checkRecoveryInventoryAction(
      "recoveryzone",
      toUtcIso(p.startTime),
      toUtcIso(p.endTime),
      { compressors: resources.compressors, attachments: resources.attachments },
    );
    if (!inventoryCheck.success) {
      toast.error(`Ден ${p.dayIndex + 1}: ${inventoryCheck.message}`);
      return false;
    }
    return true;
  };

  const handleNextPackageDaysStep = async (): Promise<boolean> => {
    for (const p of packageDays) {
      if (p.startTime) {
        const warning = checkWorkingHours(p.startTime);
        if (warning && !ignoreWorkingHoursWarning) {
          toast.error(`Ден ${p.dayIndex + 1}: ${warning}`, { duration: 5000 });
          return false;
        }
      }

      if (isRecoveryZone) {
        const passed = await checkInventoryForPackageDay(p);
        if (!passed) return false;
      }
    }
    setCurrentStep("details");
    return true;
  };

  const handleNextDetailsStep = async (): Promise<boolean> => {
    const triggers: Array<keyof ReservationFormValues> = ["clientName", "clientPhone", "clientEmail"];
    if (isTwoClients) triggers.push("client2Name", "client2Phone");

    const isValid = await form.trigger(triggers);

    const client2Name = form.getValues("client2Name");
    if (isTwoClients && (!client2Name || client2Name.length < 2)) {
      form.setError("client2Name", { message: "Името е задължително за пакети за двама." });
      return false;
    }

    if (isValid) setCurrentStep("review");
    return isValid;
  };

  const handleNext = async () => {
    if (currentStep === "time") await handleNextTimeStep();
    else if (currentStep === "packageDays") await handleNextPackageDaysStep();
    else if (currentStep === "details") await handleNextDetailsStep();
  };

  const handleBack = () => {
    if (currentStep === "details") setCurrentStep(packageDays.length > 0 ? "packageDays" : "time");
    else if (currentStep === "review") setCurrentStep("details");
    else if (currentStep === "packageDays") setCurrentStep("time");
  };

  return {
    currentStep,
    setCurrentStep,
    packageDays,
    setPackageDays,
    handleNext,
    handleBack,
    checkWorkingHours,
  };
}
