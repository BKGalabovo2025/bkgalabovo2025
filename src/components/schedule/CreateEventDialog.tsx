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
        className="sm:max-w-[480px]"
        aria-describedby={descriptionId}
      >
        <DialogHeader>
          <DialogTitle>Създаване на ново събитие</DialogTitle>
          <DialogDescription id={descriptionId}>
            Попълнете детайлите по-долу, за да създадете ново събитие в графика.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label htmlFor="title">Име на събитието</label>
            <Input
              id="title"
              placeholder="Например: Тренировка - Напреднали"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="startDate">Начало</label>
              <Input
                id="startDate"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="endDate">Край</label>
              <Input
                id="endDate"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="location">Място</label>
            <Input
              id="location"
              placeholder="Например: Спортна зала 'Младост'"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="type">Тип на събитието</label>
            <Select
              onValueChange={(value: ScheduleEventType) => setType(value)}
              defaultValue={type}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Изберете тип" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(eventTypeTranslations).map(([key, value]) => (
                  <SelectItem key={key} value={key as ScheduleEventType}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="description">Описание</label>
            <Textarea
              id="description"
              placeholder="Допълнителна информация (по желание)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 !mt-2 text-center">{error}</p>
          )}

          <DialogFooter className="!mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Отказ
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Създаване...
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
