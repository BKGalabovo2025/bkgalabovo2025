"use client";

import {
  Activity,
  Calendar,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Loader2,
  User,
} from "lucide-react";
import React from "react";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { Reservation } from "@/types";

import { reservationSchema } from "./reservation-dialog/reservation-dialog-types";
import {
  ReservationDialogProvider,
  useReservationDialog,
} from "./reservation-dialog/ReservationDialogContext";
import { ReservationStep1Time } from "./reservation-dialog/ReservationStep1Time";
import { ReservationStep2Package } from "./reservation-dialog/ReservationStep2Package";
import { ReservationStep3Details } from "./reservation-dialog/ReservationStep3Details";
import { ReservationStep4Review } from "./reservation-dialog/ReservationStep4Review";

interface ReservationDialogContentProps {
  children: React.ReactNode;
}

const ReservationDialogContent = ({
  children,
}: ReservationDialogContentProps) => {
  const {
    isOpen,
    handleOpenChange,
    isEditMode,
    currentStep,
    isRecoveryZone,
    isSaving,
    handleBack,
    handleNext,
    form,
    onSubmit,
  } = useReservationDialog();

  const steps = [
    {
      id: "time",
      label: !isRecoveryZone ? "Час & Корт" : "Услуга & Час",
      icon: !isRecoveryZone ? Calendar : Activity,
    },
    { id: "details", label: "Клиент", icon: User },
    { id: "review", label: "Преглед", icon: ClipboardCheck },
  ];

  let title = "Резервация на Корт";
  if (isEditMode) title = "Редактиране";
  else if (isRecoveryZone) title = "Резервация на Процедура";

  let description = "Създаване на нова резервация на корт и добавяне в графика";
  if (isEditMode) description = "Актуализиране на съществуваща резервация";
  else if (isRecoveryZone)
    description = "Запазване на час за възстановителна зона";

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="overflow-hidden rounded-4xl border-zinc-100 p-0 shadow-2xl sm:max-w-lg dark:border-zinc-900">
        {/* Wizard Header / Progress */}
        <div className="border-b border-zinc-100 bg-zinc-50 p-8 dark:border-zinc-900 dark:bg-zinc-900/50">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-black tracking-tighter text-zinc-950 uppercase italic dark:text-white">
                {title}
              </DialogTitle>
              <DialogDescription className="mt-1 text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                {description}
              </DialogDescription>
            </div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {currentStep === "time" && <CalendarRange className="size-6" />}
              {currentStep === "details" && <User className="size-6" />}
              {currentStep === "review" && (
                <ClipboardCheck className="size-6" />
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isPast = steps.findIndex((s) => s.id === currentStep) > idx;

              return (
                <React.Fragment key={step.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex size-8 items-center justify-center rounded-xl transition-all duration-500",
                        (() => {
                          if (isActive)
                            return "bg-primary text-white shadow-lg shadow-primary/20 scale-110";
                          if (isPast) return "bg-emerald-500 text-white";
                          return "bg-zinc-200 dark:bg-zinc-800 text-zinc-400";
                        })()
                      )}
                    >
                      {isPast ? (
                        <CheckCircle2 className="size-4" />
                      ) : (
                        <Icon className="size-4" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "hidden text-[9px] font-black tracking-widest uppercase sm:block",
                        isActive
                          ? "text-zinc-900 dark:text-white"
                          : "text-zinc-400"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className="mx-2 h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="max-h-[70vh] scrollbar-thin scrollbar-thumb-zinc-200 overflow-y-auto p-8 dark:scrollbar-thumb-zinc-800">
          <Form {...form}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (currentStep === "review") {
                  form.handleSubmit(onSubmit)();
                } else {
                  handleNext();
                }
              }}
              className="space-y-6"
            >
              {currentStep === "time" && <ReservationStep1Time />}
              {currentStep === "packageDays" && <ReservationStep2Package />}
              {currentStep === "details" && <ReservationStep3Details />}
              {currentStep === "review" && <ReservationStep4Review />}

              <div className="flex items-center justify-between border-t border-zinc-100 pt-8 dark:border-zinc-900">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    currentStep === "time"
                      ? handleOpenChange(false)
                      : handleBack()
                  }
                  className="h-12 rounded-2xl px-6 text-[10px] font-black tracking-widest text-zinc-500 uppercase hover:text-zinc-900"
                >
                  {currentStep === "time" ? (
                    "Отказ"
                  ) : (
                    <>
                      <ChevronLeft className="mr-2 size-4" /> Назад
                    </>
                  )}
                </Button>

                <Button
                  type="submit"
                  disabled={isSaving}
                  className={cn(
                    "h-12 rounded-2xl px-8 text-[10px] font-black tracking-widest uppercase shadow-lg transition-all",
                    currentStep === "review"
                      ? "bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600"
                      : "bg-primary text-white shadow-primary/20 hover:bg-primary/90"
                  )}
                >
                  {(() => {
                    if (isSaving) {
                      return (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />{" "}
                          Запис...
                        </>
                      );
                    }
                    if (currentStep === "review") {
                      return (
                        <>
                          <CheckCircle2 className="mr-2 size-4" /> Потвърди
                        </>
                      );
                    }
                    return (
                      <>
                        Напред <ChevronRight className="ml-2 size-4" />
                      </>
                    );
                  })()}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export interface ReservationDialogProps {
  children: React.ReactNode;
  reservation?: Reservation;
  initialData?: Partial<z.infer<typeof reservationSchema>>;
  onSave?: () => void;
  mode?: "courts" | "recovery";
}

export const ReservationDialog: React.FC<ReservationDialogProps> = (props) => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <ReservationDialogProvider {...props}>
      <ReservationDialogContent>{props.children}</ReservationDialogContent>
    </ReservationDialogProvider>
  );
};
