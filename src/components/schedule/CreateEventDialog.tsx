"use client";

import React, { useState, useId } from "react";
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

interface CreateEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEvent: (newEvent: Omit<ScheduleEvent, "id" | "color">) => Promise<void>;
}

const eventTypeTranslations: Record<ScheduleEventType, string> = {
  training: "Тренировка",
  competition: "Състезание",
  camp: "Лагер",
  event: "Събитие",
  other: "Друго",
};

const getDefaultStartTime = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

const getDefaultEndTime = (startTime: string) => {
  const now = new Date(startTime);
  return new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);
};

export const CreateEventDialog: React.FC<CreateEventDialogProps> = ({
  isOpen,
  onClose,
  onAddEvent,
}) => {
  const defaultStartTime = getDefaultStartTime();

  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(defaultStartTime);
  const [endDate, setEndDate] = useState(getDefaultEndTime(defaultStartTime));
  const [type, setType] = useState<ScheduleEventType>("training");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const descriptionId = useId();

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate || !endDate || !type || !location) {
      setError("Моля, попълнете всички задължителни полета.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onAddEvent({
        title,
        startDate,
        endDate,
        type,
        location,
        description,
        attendees: [],
        attendeeMemberIds: [],
      });
      handleClose();
    } catch (err) {
      setError("Възникна грешка при създаването на събитието.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Using a key on the Dialog ensures it re-mounts with fresh state
  // whenever it's opened. This avoids the need for a useEffect to reset state.
  return (
    <Dialog
      key={isOpen ? "open" : "closed"}
      open={isOpen}
      onOpenChange={handleClose}
    >
      <DialogContent
        className="sm:max-w-[540px] rounded-4xl border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-zinc-950"
        aria-describedby={descriptionId}
      >
        <div className="p-10 pb-0">
          <DialogHeader>
            <DialogTitle className="text-3xl font-light tracking-tight text-zinc-950 dark:text-white">
              Създаване на събитие
            </DialogTitle>
            <DialogDescription
              id={descriptionId}
              className="text-zinc-400 font-light mt-2"
            >
              Попълнете детайлите по-долу, за да създадете нов запис в клубния
              график.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-10 pt-8 space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="title"
              className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 ml-1"
            >
              Име на събитието
            </label>
            <Input
              id="title"
              placeholder="Например: Тренировка - Напреднали"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-12 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 shadow-none font-light focus:ring-zinc-950"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label
                htmlFor="startDate"
                className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 ml-1"
              >
                Начало
              </label>
              <Input
                id="startDate"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-12 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 shadow-none font-light"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="endDate"
                className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 ml-1"
              >
                Край
              </label>
              <Input
                id="endDate"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-12 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 shadow-none font-light"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="location"
              className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 ml-1"
            >
              Място
            </label>
            <Input
              id="location"
              placeholder="Например: Спортна зала 'Енергетик'"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-12 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 shadow-none font-light"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="type"
              className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 ml-1"
            >
              Тип на събитието
            </label>
            <Select
              onValueChange={(value: ScheduleEventType) => setType(value)}
              defaultValue={type}
            >
              <SelectTrigger
                id="type"
                className="h-12 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 shadow-none font-light"
              >
                <SelectValue placeholder="Изберете тип" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl">
                {Object.entries(eventTypeTranslations).map(([key, value]) => (
                  <SelectItem
                    key={key}
                    value={key as ScheduleEventType}
                    className="rounded-lg"
                  >
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="description"
              className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 ml-1"
            >
              Описание (по желание)
            </label>
            <Textarea
              id="description"
              placeholder="Допълнителни бележки..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px] rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-4 shadow-none font-light resize-none"
            />
          </div>

          {error && (
            <p className="text-[11px] font-medium text-rose-500 uppercase tracking-widest text-center">
              {error}
            </p>
          )}

          <DialogFooter className="pt-6 gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isSubmitting}
              className="h-12 px-8 rounded-xl font-medium text-[11px] uppercase tracking-widest text-zinc-400 hover:text-zinc-950 transition-all"
            >
              Отказ
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 px-10 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 font-medium text-[11px] uppercase tracking-widest shadow-none transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-3 h-4 w-4 animate-spin" /> Създаване
                </>
              ) : (
                "Създай събитие"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
