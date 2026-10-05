"use client";

import { FileText, RotateCcw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getSiteConfig } from "@/config/sites";
import { businessTripService } from "@/services/business-trip-service";
import { BusinessTrip } from "@/types/business-trip.types";
import { Member } from "@/types/member.types";

interface TripReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: BusinessTrip | null;
  membersDict: Record<string, Member>;
  onSuccess?: () => void;
}

export function generateDefaultReportText(
  trip: BusinessTrip,
  membersDict: Record<string, Member>,
  attachMatchProtocols: boolean = false
): string {
  const site = getSiteConfig();
  const coach = membersDict[trip.coachId];
  const coachName =
    trip.coachName ||
    (coach ? `${coach.firstName} ${coach.lastName}` : "Треньор/Ръководител");
  const coachRole =
    trip.coachRole || (coach?.isCoach ? "Треньор" : "Ръководител");

  const athletesNames = trip.participantsIds
    .map((id) => membersDict[id])
    .filter(Boolean)
    .filter((m) => !m.isCoach)
    .map((m) => `${m.firstName} ${m.lastName}`);

  const athletesCount = athletesNames.length;
  const athletesStr =
    athletesCount > 0 ? athletesNames.join(", ") : "състезателите на клуба";

  const fmtDate = (d?: string) => {
    if (!d) return "—";
    try {
      const parts = d.split("T")[0].split("-");
      if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
      return d;
    } catch {
      return d;
    }
  };

  const startStr = fmtDate(trip.startDate);
  const endStr = fmtDate(trip.endDate);
  const dest = trip.destination || "мястото на състезанието";

  const protocolLine = attachMatchProtocols
    ? `\n• Официални съдийски протоколи от изиграните срещи на състезателите;`
    : "";

  return `1. ПРОВЕЖДАНЕ И ОФИЦИАЛНО УЧАСТИЕ:
В периода от ${startStr} г. до ${endStr} г. отборът на „${site.name}“ взе участие в ${trip.title}, проведено в ${dest}. В състезанието участваха ${athletesCount} състезатели под ръководството на ${coachName} (${coachRole}).

2. ПОСТИГНАТИ РЕЗУЛТАТИ И СПОРТНО-ТЕХНИЧЕСКА ОЦЕНКА:
Състезателите (${athletesStr}) се състезаваха в определените дисциплини и възрастови групи съгласно Държавния спортен календар на БФ Бадминтон. Показаха висок спортен дух, дисциплина и стриктно спазване на състезателния правилник. Поставените цели бяха изпълнени.

3. ПРЕСТОЙ, НАСТАНЯВАНЕ И ТРАНСПОРТ:
Пътуването и престоят се осъществиха съгласно предварителния план и утвърдените условия.
(Ако състезателите са отпаднали по-рано от турнира или има промяна в броя нощувки, посочете тук: напр. „Състезателите приключиха участие в турнира на втория ден (${endStr} г.), поради което отборът се завърна същия ден. Ползвана е 1 нощувка вместо планираните 2.“)

4. ЗАКЛЮЧЕНИЕ И ПРИЛОЖЕНИЯ:
Възложените задачи със Заповедта за командировка са изпълнени. Към настоящия доклад се прилагат следните отчетни документи:${protocolLine}
• Присъствен списък / удостоверение за присъствие, заверено от главния съдия/домакина;
• Финансова ведомост за изплатени средства;
• Разходооправдателни документи (фактури за нощувки и разходи).
Настоящият доклад се представя в законоустановения 3-дневен срок съгласно Наредбата за командировките в страната.`;
}

export function TripReportDialog({
  open,
  onOpenChange,
  trip,
  membersDict,
  onSuccess,
}: TripReportDialogProps) {
  const [reportText, setReportText] = useState("");
  const [attachMatchProtocols, setAttachMatchProtocols] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && trip) {
      const hasProtocols = Boolean(trip.attachMatchProtocols);
      setAttachMatchProtocols(hasProtocols);

      if (trip.reportText && trip.reportText.trim() !== "") {
        setReportText(trip.reportText);
      } else {
        setReportText(
          generateDefaultReportText(trip, membersDict, hasProtocols)
        );
      }
    }
  }, [open, trip, membersDict]);

  const handleToggleProtocols = (checked: boolean) => {
    setAttachMatchProtocols(checked);
    const protocolItem =
      "• Официални съдийски протоколи от изиграните срещи на състезателите;";

    if (checked) {
      if (!reportText.includes(protocolItem)) {
        if (reportText.includes("следните отчетни документи:")) {
          setReportText((prev) =>
            prev.replace(
              "следните отчетни документи:",
              `следните отчетни документи:\n${protocolItem}`
            )
          );
        } else if (reportText.includes("прилагат:")) {
          setReportText((prev) =>
            prev.replace("прилагат:", `прилагат:\n${protocolItem}`)
          );
        } else if (reportText.includes("4. ЗАКЛЮЧЕНИЕ")) {
          setReportText((prev) =>
            prev.replace(
              "4. ЗАКЛЮЧЕНИЕ",
              `4. ЗАКЛЮЧЕНИЕ И ПРИЛОЖЕНИЯ\n(Приложени: ${protocolItem})\n`
            )
          );
        } else {
          setReportText((prev) => `${prev}\n\nПриложение:\n${protocolItem}`);
        }
      }
    } else {
      setReportText((prev) =>
        prev
          .replace(`\n${protocolItem}`, "")
          .replace(`${protocolItem}\n`, "")
          .replace(protocolItem, "")
      );
    }
  };

  const handleResetToDefault = () => {
    if (!trip) return;
    setReportText(
      generateDefaultReportText(trip, membersDict, attachMatchProtocols)
    );
  };

  const handleSave = async () => {
    if (!trip?.id) return;
    setIsSaving(true);
    try {
      await businessTripService.updateTrip(trip.id, {
        reportText: reportText.trim(),
        attachMatchProtocols,
      });
      toast.success("Докладът за извършената работа е записан успешно!");
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Възникна грешка при записа на доклада.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!trip) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-5 text-indigo-600" />
            Доклад за извършената работа (съгласно НКС)
          </DialogTitle>
          <DialogDescription>
            Командированият представя писмен отчет в 3-дневен срок след
            завръщането. Текстът по-долу се визуализира и отпечатва в официалния
            PDF Доклад.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Checkbox за официални съдийски протоколи */}
          <div className="flex items-start gap-2.5 rounded-lg border border-indigo-100 bg-indigo-50/60 p-3 dark:border-indigo-950/60 dark:bg-indigo-950/20">
            <Checkbox
              id="attachProtocols"
              checked={attachMatchProtocols}
              onCheckedChange={(checked) =>
                handleToggleProtocols(Boolean(checked))
              }
              className="mt-0.5"
            />
            <div className="space-y-0.5">
              <label
                htmlFor="attachProtocols"
                className="cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                Прилагам официални протоколи от срещите на състезателите
              </label>
              <p className="text-[11px] text-muted-foreground">
                Когато е отбелязано, протоколите от срещите автоматично се
                включват в текста на доклада (т. 4 Приложения). При отмаркиране
                се премахват.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Съдържание на доклада / спортния отчет:</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetToDefault}
              className="h-7 text-xs text-indigo-600 hover:text-indigo-700"
            >
              <RotateCcw className="mr-1 size-3.5" />
              Възстанови готов текст
            </Button>
          </div>

          <Textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            rows={12}
            className="font-sans text-xs leading-relaxed"
            placeholder="Въведете текст на доклада..."
          />

          <p className="text-[11px] text-muted-foreground">
            💡 <strong>Съвет:</strong> Ако състезателите са отпаднали на 2-рия
            ден и сте ползвали само 1 нощувка, опишете това в т. 3 за счетоводна
            обосновка на представената хотелска фактура.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
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
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Save className="mr-2 size-4" />
            {isSaving ? "Запазване..." : "Запази доклада"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
