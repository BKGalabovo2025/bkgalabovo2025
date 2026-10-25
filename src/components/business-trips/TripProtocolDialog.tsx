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
import { generateDefaultProtocolText } from "@/lib/business-trip-protocol";
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
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && trip) {
      // Инициализация на дата
      const rawDate = trip.usDecisionDate || trip.orderDate || trip.startDate;
      let dateVal = "";
      if (rawDate) {
        try {
          dateVal = format(new Date(rawDate), "yyyy-MM-dd");
        } catch {
          dateVal = rawDate.slice(0, 10);
        }
      }
      setMeetingDate(dateVal);

      // Инициализация на основни полета
      setMeetingTime(trip.usMeetingTime || "18:00 ч.");
      setMeetingLocation(
        trip.usMeetingLocation || "гр. Гълъбово, в седалището на сдружението"
      );
      setMeetingChair(trip.usMeetingChair || mol);
      setMeetingSecretary(trip.usMeetingSecretary || "Член на УС");

      const defMembers = `1. ${trip.usMeetingChair || mol} — Председател на Управителния съвет\n2. Членове на Управителния съвет (редовно уведомени по установения ред)`;
      setBoardMembers(trip.usBoardMembers || defMembers);

      setProtocolNumber(trip.usProtocolNumber || getTripProtocolNumber(trip));

      if (trip.protocolText && trip.protocolText.trim() !== "") {
        setProtocolText(trip.protocolText);
      } else {
        setProtocolText(
          generateDefaultProtocolText(trip, site, membersDict, {
            meetingDate: dateVal,
            meetingTime: trip.usMeetingTime || "18:00 ч.",
            meetingLocation:
              trip.usMeetingLocation ||
              "гр. Гълъбово, в седалището на сдружението",
            meetingChair: trip.usMeetingChair || mol,
            meetingSecretary: trip.usMeetingSecretary || "Член на УС",
            boardMembers: trip.usBoardMembers || defMembers,
          })
        );
      }
    }
  }, [open, trip, membersDict, mol, site]);

  const handleResetToDefaultText = () => {
    if (!trip) return;
    const text = generateDefaultProtocolText(trip, site, membersDict, {
      meetingDate,
      meetingTime,
      meetingLocation,
      meetingChair,
      meetingSecretary,
      boardMembers,
    });
    setProtocolText(text);
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
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto p-6 sm:p-7">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <FileText className="size-5" />
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
                  onChange={(e) => setProtocolNumber(e.target.value)}
                  placeholder="напр. 1-ПР"
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
                  onChange={(e) => setMeetingDate(e.target.value)}
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
                  onChange={(e) => setMeetingTime(e.target.value)}
                  placeholder="напр. 18:00 ч."
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
                  onChange={(e) => setMeetingLocation(e.target.value)}
                  placeholder="гр. Гълъбово, в седалището"
                  className="bg-white dark:bg-slate-950"
                />
              </div>
            </div>
          </div>

          {/* Секция 2: Членове и ръководство на заседанието */}
          <div className="rounded-lg border bg-slate-50/50 p-4 dark:bg-slate-900/40">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <Users className="size-4 text-indigo-600 dark:text-indigo-400" />
              2. Състав, Председателстващ и Протоколчик
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="proto-chair" className="text-xs">
                  Председателстващ заседанието
                </Label>
                <Input
                  id="proto-chair"
                  value={meetingChair}
                  onChange={(e) => setMeetingChair(e.target.value)}
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
                  onChange={(e) => setMeetingSecretary(e.target.value)}
                  placeholder="Име на протоколчика"
                  className="bg-white dark:bg-slate-950"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="proto-members" className="text-xs">
                  Присъстващи членове на УС (кворум)
                </Label>
                <Textarea
                  id="proto-members"
                  rows={2}
                  value={boardMembers}
                  onChange={(e) => setBoardMembers(e.target.value)}
                  placeholder="Списък с членове на Управителния съвет..."
                  className="bg-white text-xs dark:bg-slate-950"
                />
              </div>
            </div>
          </div>

          {/* Секция 3: Пълен текст на протокола */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label
                htmlFor="proto-text"
                className="text-sm font-semibold text-slate-800 dark:text-slate-200"
              >
                3. Пълен текст на Протокола (дневен ред, разисквания, гласуване,
                решения)
              </Label>
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
            <p className="text-xs text-muted-foreground">
              Можете да редактирате свободно всеки абзац от протокола.
              Редактираният текст се отпечатва директно в официалния PDF
              документ.
            </p>
            <Textarea
              id="proto-text"
              rows={14}
              value={protocolText}
              onChange={(e) => setProtocolText(e.target.value)}
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
