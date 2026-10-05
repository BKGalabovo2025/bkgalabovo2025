"use client";

import { differenceInCalendarDays } from "date-fns";
import { Calculator, RotateCcw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { businessTripService } from "@/services/business-trip-service";
import { BusinessTrip } from "@/types/business-trip.types";

interface TripStatementEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: BusinessTrip | null;
  onSuccess?: () => void;
}

export function TripStatementEditDialog({
  open,
  onOpenChange,
  trip,
  onSuccess,
}: TripStatementEditDialogProps) {
  const [actualDays, setActualDays] = useState<number | "">("");
  const [actualNights, setActualNights] = useState<number | "">("");
  const [isSaving, setIsSaving] = useState(false);

  // Planned values from dates
  const plannedDays = trip
    ? Math.max(
        1,
        differenceInCalendarDays(
          new Date(trip.endDate),
          new Date(trip.startDate)
        ) + 1
      )
    : 0;
  const plannedNights = trip
    ? Math.max(
        0,
        differenceInCalendarDays(
          new Date(trip.endDate),
          new Date(trip.startDate)
        )
      )
    : 0;

  useEffect(() => {
    if (open && trip) {
      setActualDays(trip.actualDays != null ? trip.actualDays : plannedDays);
      setActualNights(
        trip.actualNights != null ? trip.actualNights : plannedNights
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, trip]);

  const handleReset = () => {
    setActualDays(plannedDays);
    setActualNights(plannedNights);
  };

  const handleSave = async () => {
    if (!trip?.id) return;
    setIsSaving(true);
    try {
      await businessTripService.updateTrip(trip.id, {
        actualDays: actualDays === "" ? undefined : Number(actualDays),
        actualNights: actualNights === "" ? undefined : Number(actualNights),
      });
      toast.success("Ведомостта е актуализирана успешно!");
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Грешка при записа.");
    } finally {
      setIsSaving(false);
    }
  };

  // Preview calculations
  const perDiemEUR =
    trip?.financials.perDiemOverrideEUR ?? trip?.financials.perDiemRateEUR ?? 0;
  const previewDays = actualDays === "" ? plannedDays : Number(actualDays);
  const previewNights =
    actualNights === "" ? plannedNights : Number(actualNights);
  const previewDiemTotal = perDiemEUR * previewDays;
  const accomEUR = trip?.financials.accommodationRateEUR ?? 0;
  const totalPeople = (trip?.participantsIds.length ?? 0) + 1; // +1 for coach
  const previewAccomTotal = accomEUR * previewNights * totalPeople;

  if (!trip) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="size-5 text-blue-600" />
            Редактиране на Ведомост
          </DialogTitle>
          <DialogDescription>
            Коригирайте реалния брой дни и нощи ако участниците са се върнали
            по-рано (напр. поради отпадане от турнира). Ведомостта ще се
            преизчисли автоматично.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Planned vs actual comparison */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs dark:border-amber-900/50 dark:bg-amber-950/30">
            <p className="font-semibold text-amber-800 dark:text-amber-300">
              Планирано (по дати):
            </p>
            <p className="text-amber-700 dark:text-amber-400">
              {plannedDays} {plannedDays === 1 ? "ден" : "дни"} /{" "}
              {plannedNights} {plannedNights === 1 ? "нощ" : "нощи"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="actual-days" className="text-sm font-medium">
                Реално изкарани дни
              </Label>
              <Input
                id="actual-days"
                type="number"
                min={0}
                max={plannedDays}
                value={actualDays}
                onChange={(e) =>
                  setActualDays(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                className="text-center"
              />
              <p className="text-[11px] text-muted-foreground">
                Планирано: {plannedDays} {plannedDays === 1 ? "ден" : "дни"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="actual-nights" className="text-sm font-medium">
                Реално изкарани нощи
              </Label>
              <Input
                id="actual-nights"
                type="number"
                min={0}
                max={plannedNights}
                value={actualNights}
                onChange={(e) =>
                  setActualNights(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                className="text-center"
              />
              <p className="text-[11px] text-muted-foreground">
                Планирано: {plannedNights}{" "}
                {plannedNights === 1 ? "нощ" : "нощи"}
              </p>
            </div>
          </div>

          {/* Preview */}
          {perDiemEUR > 0 && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs dark:border-emerald-900/50 dark:bg-emerald-950/30">
              <p className="mb-1 font-semibold text-emerald-800 dark:text-emerald-300">
                Преизчислено (на лице):
              </p>
              <p className="text-emerald-700 dark:text-emerald-400">
                Дневни: €{perDiemEUR.toFixed(2)} × {previewDays}{" "}
                {previewDays === 1 ? "ден" : "дни"} ={" "}
                <strong>€{previewDiemTotal.toFixed(2)}</strong>
              </p>
              {accomEUR > 0 && (
                <p className="text-emerald-700 dark:text-emerald-400">
                  Квартирни: €{accomEUR.toFixed(2)} × {previewNights}{" "}
                  {previewNights === 1 ? "нощ" : "нощи"} × {totalPeople} лица ={" "}
                  <strong>€{previewAccomTotal.toFixed(2)}</strong>
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="mr-auto text-xs text-muted-foreground"
          >
            <RotateCcw className="mr-1 size-3.5" />
            Възстанови планираните
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Отказ
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Save className="mr-2 size-4" />
            {isSaving ? "Запазване..." : "Запази и преизчисли"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
