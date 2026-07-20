"use client";

import React from "react";
import * as z from "zod";
import { Form } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronRight, ChevronLeft, CalendarRange, Calendar, User, ClipboardCheck, CheckCircle2, Activity } from "lucide-react";
import { Reservation } from "@/types";
import { cn } from "@/lib/utils";

import { ReservationDialogProvider, useReservationDialog, reservationSchema } from "./reservation-dialog/ReservationDialogContext";
import { ReservationStep1Time } from "./reservation-dialog/ReservationStep1Time";
import { ReservationStep2Package } from "./reservation-dialog/ReservationStep2Package";
import { ReservationStep3Details } from "./reservation-dialog/ReservationStep3Details";
import { ReservationStep4Review } from "./reservation-dialog/ReservationStep4Review";

interface ReservationDialogContentProps {
  children: React.ReactNode;
}

const ReservationDialogContent = ({ children }: ReservationDialogContentProps) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg rounded-4xl border-zinc-100 dark:border-zinc-900 shadow-2xl p-0 overflow-hidden">
        {/* Wizard Header / Progress */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-8 border-b border-zinc-100 dark:border-zinc-900">
          <div className="flex items-center justify-between mb-8">
            <div>
              <DialogTitle className="text-2xl font-black text-zinc-950 dark:text-white tracking-tighter uppercase italic">
                {isEditMode 
                  ? "Редактиране" 
                  : (isRecoveryZone ? "Резервация на Процедура" : "Резервация на Корт")}
              </DialogTitle>
              <DialogDescription className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                {isEditMode 
                  ? "Актуализиране на съществуваща резервация" 
                  : (isRecoveryZone ? "Запазване на час за възстановителна зона" : "Създаване на нова резервация на корт и добавяне в графика")}
              </DialogDescription>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              {currentStep === "time" && <CalendarRange className="w-6 h-6" />}
              {currentStep === "details" && <User className="w-6 h-6" />}
              {currentStep === "review" && <ClipboardCheck className="w-6 h-6" />}
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
                        "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500",
                        (() => {
                          if (isActive) return "bg-primary text-white shadow-lg shadow-primary/20 scale-110";
                          if (isPast) return "bg-emerald-500 text-white";
                          return "bg-zinc-200 dark:bg-zinc-800 text-zinc-400";
                        })()
                      )}
                    >
                      {isPast ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span
                      className={cn(
                        "text-[9px] font-black uppercase tracking-widest hidden sm:block",
                        isActive ? "text-zinc-900 dark:text-white" : "text-zinc-400"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < steps.length - 1 && <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800 mx-2" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="p-8 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
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

              <div className="flex justify-between items-center pt-8 border-t border-zinc-100 dark:border-zinc-900">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => (currentStep === "time" ? handleOpenChange(false) : handleBack())}
                  className="h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900"
                >
                  {currentStep === "time" ? "Отказ" : <><ChevronLeft className="w-4 h-4 mr-2" /> Назад</>}
                </Button>

                <Button
                  type="submit"
                  disabled={isSaving}
                  className={cn(
                    "h-12 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all",
                    currentStep === "review"
                      ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20 text-white"
                      : "bg-primary hover:bg-primary/90 shadow-primary/20 text-white"
                  )}
                >
                  {(() => {
                    if (isSaving) {
                      return <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Запис...</>;
                    }
                    if (currentStep === "review") {
                      return <><CheckCircle2 className="w-4 h-4 mr-2" /> Потвърди</>;
                    }
                    return <>Напред <ChevronRight className="w-4 h-4 ml-2" /></>;
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
      <ReservationDialogContent>
        {props.children}
      </ReservationDialogContent>
    </ReservationDialogProvider>
  );
};
