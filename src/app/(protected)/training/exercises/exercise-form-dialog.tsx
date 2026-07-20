"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Exercise,
  ExerciseCategory,
  LocationType,
} from "@/types/planner.types";
import { plannerService } from "@/services/planner-service";
import { useAppStore } from "@/store/use-app-store";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2 } from "lucide-react";

interface Props {
  exercise: Exercise | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveSuccess: () => void;
}

const AGE_GROUPS = ["U9", "U11", "U13", "U15", "U17", "U19", "Мъже и Жени"];

export default function ExerciseFormDialog({
  exercise,
  open,
  onOpenChange,
  onSaveSuccess,
}: Props) {
  const { activeBranch } = useAppStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExerciseCategory>("physical");
  const [source, setSource] = useState("");
  const [locations, setLocations] = useState<LocationType[]>(["indoor"]);
  const [ageGroups, setAgeGroups] = useState<string[]>([]);
  const [duration, setDuration] = useState(10);
  const [equipment, setEquipment] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  useEffect(() => {
    if (open) {
      if (exercise) {
        setName(exercise.name);
        setDescription(exercise.description);
        setCategory(exercise.category);
        setSource(exercise.source);
        setLocations(exercise.location);
        setAgeGroups(exercise.ageGroups);
        setDuration(exercise.durationMinutes);
        setEquipment(exercise.equipment);
        setVideoUrl(exercise.videoUrl || "");
      } else {
        // Reset defaults
        setName("");
        setDescription("");
        setCategory("physical");
        setSource("");
        setLocations(["indoor"]);
        setAgeGroups(["U13", "U15"]);
        setDuration(10);
        setEquipment("");
        setVideoUrl("");
      }
    }
  }, [open, exercise]);

  const toggleAgeGroup = (ag: string) => {
    setAgeGroups((prev) =>
      prev.includes(ag) ? prev.filter((g) => g !== ag) : [...prev, ag]
    );
  };

  const handleSave = async () => {
    if (!name || ageGroups.length === 0) return;
    setIsSaving(true);
    try {
      const payload = {
        name,
        description,
        category,
        source,
        location: locations,
        ageGroups,
        durationMinutes: duration,
        equipment,
        videoUrl: videoUrl || undefined,
      };

      if (exercise) {
        await plannerService.updateExercise(exercise.id, payload);
      } else {
        await plannerService.addExercise(activeBranch, payload);
      }
      onSaveSuccess();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!exercise) return;
    if (!confirm("Сигурни ли сте, че искате да изтриете това упражнение?"))
      return;
    setIsDeleting(true);
    try {
      await plannerService.deleteExercise(exercise.id);
      onSaveSuccess();
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {exercise ? "Редакция на упражнение" : "Ново упражнение"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Име на упражнението *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="напр. Footwork Звезда"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Категория</Label>
              <Select
                value={category}
                onValueChange={(val: ExerciseCategory) => setCategory(val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="physical">ОФП / Физика</SelectItem>
                  <SelectItem value="technical">Техника</SelectItem>
                  <SelectItem value="tactical">Тактика</SelectItem>
                  <SelectItem value="mental">Психология</SelectItem>
                  <SelectItem value="warmup">Загрявка</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Локация</Label>
              <Select
                value={
                  locations.includes("indoor") && locations.includes("outdoor")
                    ? "both"
                    : locations[0]
                }
                onValueChange={(val: string) => {
                  if (val === "both") setLocations(["indoor", "outdoor"]);
                  else setLocations([val as LocationType]);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indoor">Само в зала (Корт)</SelectItem>
                  <SelectItem value="outdoor">
                    Само на открито (Стадион)
                  </SelectItem>
                  <SelectItem value="both">Универсално (Навсякъде)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Възрастови групи *</Label>
            <div className="flex flex-wrap gap-2">
              {AGE_GROUPS.map((ag) => (
                <Badge
                  key={ag}
                  variant={ageGroups.includes(ag) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleAgeGroup(ag)}
                >
                  {ag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Описание</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Подробно описание на упражнението..."
              className="h-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Продължителност (минути)</Label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Източник (опционално)</Label>
              <Input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="BWF, Личен опит..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Нужна екипировка</Label>
            <Input
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              placeholder="Конуси, 30 пера..."
            />
          </div>

          <div className="space-y-2">
            <Label>Видео линк (YouTube / Local path)</Label>
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/... или /public/video.mp4"
            />
          </div>
        </div>

        <DialogFooter className="flex w-full items-center justify-between sm:justify-between">
          {exercise ? (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 size-4" />
              )}
              Изтрий
            </Button>
          ) : (
            <div></div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Отказ
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !name || ageGroups.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Запази
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
