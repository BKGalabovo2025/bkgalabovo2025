"use client";

import React, { useState, useId, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScheduleEvent, ScheduleEventType } from "@/types";
import { Loader2 } from "lucide-react";

interface EditEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: ScheduleEvent | null;
  onUpdateEvent: (
    eventId: string,
    eventData: Partial<Omit<ScheduleEvent, "id" | "color">>
  ) => Promise<void>;
}

const eventTypeTranslations: Record<ScheduleEventType, string> = {
  training: "Тренировка",
  competition: "Състезание",
  camp: "Лагер",
  event: "Събитие",
  other: "Друго",
};

// Helper to format date for datetime-local input
const toLocalISOString = (dateString: string | undefined | null): string => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const tzoffset = new Date().getTimezoneOffset() * 60000; //offset in milliseconds
    const localISOTime = new Date(date.getTime() - tzoffset)
      .toISOString()
      .slice(0, 16);
    return localISOTime;
  } catch {
    return ""; // Handle invalid date string gracefully
  }
};

export const EditEventDialog: React.FC<EditEventDialogProps> = ({
  isOpen,
  onClose,
  event,
  onUpdateEvent,
}) => {
  // State is initialized directly from the event prop.
  // The key on DialogContent ensures the form resets when the event changes.
  const [title, setTitle] = useState(event?.title || "");
  const [startDate, setStartDate] = useState(
    toLocalISOString(event?.startDate)
  );
  const [endDate, setEndDate] = useState(toLocalISOString(event?.endDate));
  const [type, setType] = useState<ScheduleEventType>(
    event?.type || "training"
  );
  const [location, setLocation] = useState(event?.location || "");
  const [description, setDescription] = useState(event?.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state with event prop when dialog opens or event changes
  useEffect(() => {
    if (event && isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(event.title || "");
      setStartDate(toLocalISOString(event.startDate));
      setEndDate(toLocalISOString(event.endDate));
      setType(event.type || "training");
      setLocation(event.location || "");
      setDescription(event.description || "");
    }
  }, [event, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    if (!title || !startDate || !endDate || !type || !location) {
      setError("Моля, попълнете всички задължителни полета.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onUpdateEvent(event.id, {
        title,
        startDate,
        endDate,
        type,
        location,
        description,
      });
      onClose();
    } catch (err) {
      setError("Възникна грешка при обновяването на събитието.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const descriptionId = useId();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        key={event?.id}
        className="sm:max-w-[480px] w-[92vw] rounded-4xl sm:rounded-5xl border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-zinc-950 flex flex-col max-h-[85vh] sm:max-h-[90vh]"
        aria-describedby={descriptionId}
      >
        <div className="flex flex-col h-full overflow-hidden">
          <div className="p-6 sm:p-8 pb-4 shrink-0 border-b border-zinc-100 dark:border-zinc-900">
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl font-light tracking-tight text-zinc-950 dark:text-white">
                Редактиране на събитие
              </DialogTitle>
              <DialogDescription
                id={descriptionId}
                className="text-zinc-400 font-light mt-1 text-xs sm:text-sm"
              >
                Променете детайлите на събитието и запазете промените.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="overflow-y-auto custom-scrollbar flex-1 overscroll-contain">
            {event && (
              <form
                id="edit-event-form"
                onSubmit={handleSubmit}
                className="p-6 sm:p-8 space-y-4 sm:space-y-5"
              >
                <div className="space-y-2">
                  <label
                    htmlFor="edit-title"
                    className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 ml-1"
                  >
                    Име на събитието
                  </label>
                  <Input
                    id="edit-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-11 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 shadow-none font-light focus:ring-zinc-950"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label
                      htmlFor="edit-startDate"
                      className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 ml-1"
                    >
                      Начало
                    </label>
                    <Input
                      id="edit-startDate"
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-11 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 shadow-none font-light"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="edit-endDate"
                      className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 ml-1"
                    >
                      Край
                    </label>
                    <Input
                      id="edit-endDate"
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-11 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 shadow-none font-light"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="edit-location"
                    className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 ml-1"
                  >
                    Място
                  </label>
                  <Input
                    id="edit-location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="h-11 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 shadow-none font-light"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="edit-type"
                    className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 ml-1"
                  >
                    Тип на събитието
                  </label>
                  <Select
                    onValueChange={(value: ScheduleEventType) => setType(value)}
                    value={type}
                  >
                    <SelectTrigger
                      id="edit-type"
                      className="h-11 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 shadow-none font-light"
                    >
                      <SelectValue placeholder="Изберете тип" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl">
                      {Object.entries(eventTypeTranslations).map(
                        ([key, value]) => (
                          <SelectItem
                            key={key}
                            value={key as ScheduleEventType}
                            className="rounded-lg"
                          >
                            {value}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="edit-description"
                    className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 ml-1"
                  >
                    Описание
                  </label>
                  <Textarea
                    id="edit-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[80px] rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-4 shadow-none font-light resize-none"
                  />
                </div>

                {error && (
                  <p className="text-[11px] font-medium text-rose-500 uppercase tracking-widest text-center">
                    {error}
                  </p>
                )}
              </form>
            )}
          </div>

          <div className="p-6 sm:p-8 pt-4 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/30 dark:bg-zinc-900/20 shrink-0">
            <DialogFooter className="gap-3 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl font-medium text-[11px] uppercase tracking-widest h-11 px-6 hover:bg-white dark:hover:bg-zinc-900 transition-all"
              >
                Отказ
              </Button>
              <Button
                type="submit"
                form="edit-event-form"
                disabled={isSubmitting}
                className="bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 rounded-xl font-medium text-[11px] uppercase tracking-widest h-11 px-8 shadow-none transition-all ml-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Запазване...
                  </>
                ) : (
                  "Запази промените"
                )}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
