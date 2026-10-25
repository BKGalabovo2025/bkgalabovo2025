"use client";

import { format } from "date-fns";
import {
  Calendar,
  Clock,
  Eye,
  FileText,
  Loader2,
  MapPin,
  RotateCcw,
  Save,
  Users,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getSiteConfig } from "@/config/sites";
import { getTripProtocolNumber } from "@/lib/business-trip-numbers";
import {
  cleanProtocolText,
  generateDefaultProtocolText,
  isFemalePerson,
} from "@/lib/business-trip-protocol";
import { businessTripService } from "@/services/business-trip-service";
import { BusinessTrip } from "@/types/business-trip.types";
import { Member } from "@/types/member.types";

interface TripProtocolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: BusinessTrip | null;
  membersDict: Record<string, Member>;
  onSuccess?: (updatedTrip: BusinessTrip) => void;
  onPreview?: (trip: BusinessTrip) => void;
}

export function TripProtocolDialog({
  open,
  onOpenChange,
  trip,
  membersDict,
  onSuccess,
  onPreview,
}: TripProtocolDialogProps) {
  const site = getSiteConfig();
  const mol = site.contact.mol || "М. Георгиева";

  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [meetingChair, setMeetingChair] = useState("");
  const [meetingSecretary, setMeetingSecretary] = useState("");
  const [boardMembers, setBoardMembers] = useState("");
  const [protocolNumber, setProtocolNumber] = useState("");
  const [protocolText, setProtocolText] = useState("");
  const [autoSyncText, setAutoSyncText] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && trip) {
      // Инициализация на дата
      const rawDate = trip.usDecisionDate || trip.orderDate || trip.startDate;
      let dateVal = "";
      if (rawDate) {
        const clean = rawDate.replace(/\s*г\.?$/u, "").trim();
        const ddmmyyyy = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(clean);
        if (ddmmyyyy) {
          const [, d, m, y] = ddmmyyyy;
          dateVal = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
        } else {
          try {
            dateVal = format(new Date(clean), "yyyy-MM-dd");
          } catch {
            dateVal = clean.slice(0, 10);
          }
        }
      }
      setMeetingDate(dateVal);

      // Инициализация на основни полета
      const timeVal = trip.usMeetingTime || "18:00 ч.";
      const locVal =
        trip.usMeetingLocation || "гр. Гълъбово, в седалището на сдружението";
      const chairVal = trip.usMeetingChair || mol;
      const secVal = trip.usMeetingSecretary || "Невена Георгиева";
      const defMembers =
        secVal && secVal.toLowerCase() !== "член на ус"
          ? `1. ${chairVal} — Председател на Управителния съвет\n2. ${secVal} — Член на Управителния съвет (редовно уведомен по установения ред)`
          : `1. ${chairVal} — Председател на Управителния съвет\n2. Членове на Управителния съвет (редовно уведомени по установения ред)`;
      const membersVal = trip.usBoardMembers || defMembers;
      const protoNumVal = trip.usProtocolNumber || getTripProtocolNumber(trip);

      setMeetingTime(timeVal);
      setMeetingLocation(locVal);
      setMeetingChair(chairVal);
      setMeetingSecretary(secVal);
      setBoardMembers(membersVal);
      setProtocolNumber(protoNumVal);

      if (trip.protocolText && trip.protocolText.trim() !== "") {
        setProtocolText(
          cleanProtocolText(
            trip.protocolText,
            isFemalePerson(chairVal, membersDict),
            site.shortName
          )
        );
        setAutoSyncText(false);
      } else {
        setAutoSyncText(true);
        setProtocolText(
          generateDefaultProtocolText(trip, site, membersDict, {
            meetingDate: dateVal,
            meetingTime: timeVal,
            meetingLocation: locVal,
            meetingChair: chairVal,
            meetingSecretary: secVal,
            boardMembers: membersVal,
            protocolNumber: protoNumVal,
          })
        );
      }
    }
  }, [open, trip, membersDict, mol, site]);

  const updateFieldsAndSync = (next: {
    date?: string;
    time?: string;
    location?: string;
    chair?: string;
    secretary?: string;
    members?: string;
    protoNum?: string;
  }) => {
    const d = next.date !== undefined ? next.date : meetingDate;
    const t = next.time !== undefined ? next.time : meetingTime;
    const loc = next.location !== undefined ? next.location : meetingLocation;
    const ch = next.chair !== undefined ? next.chair : meetingChair;
    const sec =
      next.secretary !== undefined ? next.secretary : meetingSecretary;
    const mem = next.members !== undefined ? next.members : boardMembers;
    const pNum = next.protoNum !== undefined ? next.protoNum : protocolNumber;

    if (next.date !== undefined) setMeetingDate(next.date);
    if (next.time !== undefined) setMeetingTime(next.time);
    if (next.location !== undefined) setMeetingLocation(next.location);
    if (next.chair !== undefined) setMeetingChair(next.chair);
    if (next.secretary !== undefined) setMeetingSecretary(next.secretary);
    if (next.members !== undefined) setBoardMembers(next.members);
    if (next.protoNum !== undefined) setProtocolNumber(next.protoNum);

    if (autoSyncText && trip) {
      const regenerated = generateDefaultProtocolText(trip, site, membersDict, {
        meetingDate: d,
        meetingTime: t,
        meetingLocation: loc,
        meetingChair: ch,
        meetingSecretary: sec,
        boardMembers: mem,
        protocolNumber: pNum,
      });
      setProtocolText(regenerated);
    }
  };

  const handleResetToDefaultText = () => {
    if (!trip) return;
    const text = generateDefaultProtocolText(trip, site, membersDict, {
      meetingDate,
      meetingTime,
      meetingLocation,
      meetingChair,
      meetingSecretary,
      boardMembers,
      protocolNumber,
    });
    setProtocolText(text);
    setAutoSyncText(true);
    toast.info("Текстът на протокола бе прегенериран от текущите полета.");
  };

  const handleSave = async (andPreview = false) => {
    if (!trip || !trip.id) {
      toast.error("Липсва валидна командировка.");
      return;
    }

    try {
      setIsSaving(true);

      const updatedPayload: Partial<BusinessTrip> = {
        usDecisionDate: meetingDate || trip.usDecisionDate,
        usMeetingTime: meetingTime.trim(),
        usMeetingLocation: meetingLocation.trim(),
        usMeetingChair: meetingChair.trim(),
        usMeetingSecretary: meetingSecretary.trim(),
        usBoardMembers: boardMembers.trim(),
        usProtocolNumber: protocolNumber.trim(),
        protocolText: protocolText.trim(),
      };

      await businessTripService.updateTrip(trip.id, updatedPayload);

      const mergedTrip: BusinessTrip = {
        ...trip,
        ...updatedPayload,
      };

      toast.success("Протоколът от заседание на УС беше успешно запазен!");
      onSuccess?.(mergedTrip);

      if (andPreview) {
        onPreview?.(mergedTrip);
      }

      onOpenChange(false);
    } catch (err: unknown) {
      console.error("Грешка при запазване на протокола:", err);
      const msg = err instanceof Error ? err.message : "Грешка в базата данни";
      toast.error("Неуспешно запазване: " + msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (!trip) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-2xl p-4 sm:p-5">
        <DialogHeader className="border-b pb-2">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-indigo-50 p-1.5 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <FileText className="size-4.5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                Редакция на Протокол от заседание на УС
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Коригирайте датата, часа, мястото, присъстващите членове и
                пълния текст на Протокола за {trip.title}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Секция 1: Реквизити на заседанието */}
          <div className="rounded-lg border bg-slate-50/50 p-4 dark:bg-slate-900/40">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <Calendar className="size-4 text-indigo-600 dark:text-indigo-400" />
              1. Реквизити и място на провеждане
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="proto-num" className="text-xs">
                  Протокол №
                </Label>
                <Input
                  id="proto-num"
                  value={protocolNumber}
                  onChange={(e) =>
                    updateFieldsAndSync({ protoNum: e.target.value })
                  }
                  placeholder="напр. 9-ПР"
                  className="bg-white dark:bg-slate-950"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="proto-date" className="text-xs">
                  Дата на заседание
                </Label>
                <Input
                  id="proto-date"
                  type="date"
                  value={meetingDate}
                  onChange={(e) =>
                    updateFieldsAndSync({ date: e.target.value })
                  }
                  className="bg-white dark:bg-slate-950"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="proto-time"
                  className="text-xs flex items-center gap-1"
                >
                  <Clock className="size-3" /> Час на заседание
                </Label>
                <Input
                  id="proto-time"
                  value={meetingTime}
                  onChange={(e) =>
                    updateFieldsAndSync({ time: e.target.value })
                  }
                  placeholder="напр. 18:30 ч."
                  className="bg-white dark:bg-slate-950"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="proto-location"
                  className="text-xs flex items-center gap-1"
                >
                  <MapPin className="size-3" /> Място на провеждане
                </Label>
                <Input
                  id="proto-location"
                  value={meetingLocation}
                  onChange={(e) =>
                    updateFieldsAndSync({ location: e.target.value })
                  }
                  placeholder="напр. Спортна зала 'Енергетик' град Гълъбово"
                  className="bg-white dark:bg-slate-950"
                />
              </div>
            </div>
          </div>

          {/* Секция 2: Членове и ръководство на заседанието */}
          <div className="rounded-lg border bg-slate-50/50 p-4 dark:bg-slate-900/40">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <Users className="size-4 text-indigo-600 dark:text-indigo-400" />
              2. Състав: Председател на заседанието, Протоколчик и Членове на УС
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="proto-chair" className="text-xs">
                  Председател на заседанието
                </Label>
                <Input
                  id="proto-chair"
                  value={meetingChair}
                  onChange={(e) =>
                    updateFieldsAndSync({ chair: e.target.value })
                  }
                  placeholder="Име на председателя"
                  className="bg-white dark:bg-slate-950"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="proto-secretary" className="text-xs">
                  Протоколчик
                </Label>
                <Input
                  id="proto-secretary"
                  value={meetingSecretary}
                  onChange={(e) =>
                    updateFieldsAndSync({ secretary: e.target.value })
                  }
                  placeholder="Име на протоколчика"
                  className="bg-white dark:bg-slate-950"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="proto-members" className="text-xs">
                    Присъстващи членове на УС (кворум и подписи)
                  </Label>
                  <span className="text-[10px] text-slate-500">
                    Имената се извличат автоматично за подписите под протокола
                  </span>
                </div>
                <Textarea
                  id="proto-members"
                  rows={3}
                  value={boardMembers}
                  onChange={(e) =>
                    updateFieldsAndSync({ members: e.target.value })
                  }
                  placeholder={`1. ${meetingChair || mol} — Председател на УС\n2. ${meetingSecretary || "Невена Георгиева"} — Член на УС\n3. Име на член — Член на УС`}
                  className="bg-white text-xs dark:bg-slate-950"
                />
                <p className="text-[11px] text-slate-500">
                  Въведете всеки член на нов ред. Присъстващите членове (без
                  Председателя, който подписва отделно) се извеждат автоматично
                  с поименни редове в колоната „ЧЛЕНОВЕ НА УС“.
                </p>
              </div>
            </div>
          </div>

          {/* Секция 3: Пълен текст на протокола */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="proto-text"
                  className="text-sm font-semibold text-slate-800 dark:text-slate-200"
                >
                  3. Пълен текст на Протокола (дневен ред, разисквания,
                  гласуване, решения)
                </Label>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetToDefaultText}
                className="h-7 text-xs text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/30"
              >
                <RotateCcw className="mr-1.5 size-3" />
                Прегенерирай от горните полета
              </Button>
            </div>

            <div className="flex items-center gap-2 pt-1 pb-0.5">
              <Checkbox
                id="auto-sync-text"
                checked={autoSyncText}
                onCheckedChange={(checked) => {
                  const val = Boolean(checked);
                  setAutoSyncText(val);
                  if (val && trip) {
                    const text = generateDefaultProtocolText(
                      trip,
                      site,
                      membersDict,
                      {
                        meetingDate,
                        meetingTime,
                        meetingLocation,
                        meetingChair,
                        meetingSecretary,
                        boardMembers,
                        protocolNumber,
                      }
                    );
                    setProtocolText(text);
                  }
                }}
              />
              <Label
                htmlFor="auto-sync-text"
                className="cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Автоматично актуализирай текста при промяна на горните полета
                (Дата, Час, Място, Членове)
              </Label>
            </div>

            <p className="text-xs text-muted-foreground">
              {autoSyncText
                ? "🟢 В момента текстът се обновява автоматично според въведените по-горе реквизити."
                : "✏️ Режим на ръчно редактиране. Въведените от вас промени в текста се запазват."}
            </p>
            <Textarea
              id="proto-text"
              rows={14}
              value={protocolText}
              onChange={(e) => {
                setProtocolText(e.target.value);
                setAutoSyncText(false);
              }}
              className="font-mono text-xs leading-relaxed"
              placeholder="Въведете или коригирайте текста на протокола..."
            />
          </div>
        </div>

        <DialogFooter className="mt-4 flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Отказ
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            {onPreview && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleSave(true)}
                disabled={isSaving}
                className="gap-1.5"
              >
                <Eye className="size-4" />
                Запази и Прегледай PDF
              </Button>
            )}
            <Button
              type="button"
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Запазване...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Запази промените
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
