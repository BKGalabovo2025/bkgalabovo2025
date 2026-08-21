"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { plannerService } from "@/services/planner-service";
import { useAppStore } from "@/store/use-app-store";
import {
  Exercise,
  ExerciseCategory,
  LocationType,
} from "@/types/planner.types";

interface Props {
  exercise: Exercise | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveSuccess: () => void;
}

const AGE_GROUPS = ["U9", "U11", "U13", "U15", "U17", "U19", "Мъже и Жени"];
const POPULAR_EQUIPMENT = [
  "Ракети",
  "Пера",
  "Балони",
  "Конуси",
  "Въже",
  "Ластици",
  "Стълбичка",
];
const POPULAR_PREREQUISITES = [
  "Основен хват",
  "Бекхенд хват",
  "Правилен напад (Lunge)",
  "Повдигане (Lift)",
  "Шасе стъпки",
  "Сплит стъпка",
];

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
  const [coachingPoints, setCoachingPoints] = useState("");
  const [category, setCategory] = useState<ExerciseCategory>("physical");
  const [source, setSource] = useState("");
  const [locations, setLocations] = useState<LocationType[]>(["court"]);
  const [ageGroups, setAgeGroups] = useState<string[]>([]);
  const [duration, setDuration] = useState(10);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [prerequisites, setPrerequisites] = useState<string[]>([]);
  const [customEq, setCustomEq] = useState("");
  const [customReq, setCustomReq] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  useEffect(() => {
    if (open) {
      if (exercise) {
        setName(exercise.name);
        setDescription(exercise.description);
        setCoachingPoints(exercise.coachingPoints?.join("\n") || "");
        setCategory(exercise.category);
        setSource(exercise.source ?? "");
        setLocations(exercise.location || ["court"]);
        setAgeGroups(exercise.ageGroups);
        setDuration(exercise.durationMinutes);
        setEquipment(exercise.equipment || []);
        setPrerequisites(exercise.prerequisites || []);
        setVideoUrl(exercise.videoUrl || "");
      } else {
        // Reset defaults
        setName("");
        setDescription("");
        setCoachingPoints("");
        setCategory("physical");
        setSource("");
        setLocations(["court"]);
        setAgeGroups(["U13", "U15"]);
        setDuration(10);
        setEquipment([]);
        setPrerequisites([]);
        setCustomEq("");
        setCustomReq("");
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
        coachingPoints: coachingPoints
          .split("\n")
          .filter((p) => p.trim() !== ""),
        category,
        source,
        location: locations,
        ageGroups,
        durationMinutes: duration,
        equipment,
        prerequisites,
        videoUrl: videoUrl || "",
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
                  <SelectItem value="warmup">Загрявка</SelectItem>
                  <SelectItem value="technique">Техника</SelectItem>
                  <SelectItem value="tactics">Тактика</SelectItem>
                  <SelectItem value="physical">ОФП / Физика</SelectItem>
                  <SelectItem value="games">Игри и Забава</SelectItem>
                  <SelectItem value="cooldown">Разпускане</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Локация</Label>
              <Select
                value={locations[0] || "court"}
                onValueChange={(val: string) => {
                  setLocations([val as LocationType]);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="court">Само в зала (Корт)</SelectItem>
                  <SelectItem value="stadium">Стадион / Трева</SelectItem>
                  <SelectItem value="beach">Плаж / На открито</SelectItem>
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

          <div className="space-y-2">
            <Label>Треньорски насоки (по една на ред)</Label>
            <Textarea
              value={coachingPoints}
              onChange={(e) => setCoachingPoints(e.target.value)}
              placeholder="Какво да следим? Най-чести грешки..."
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
            <Label>Нужна екипировка (Уреди)</Label>
            <div className="mb-2 flex flex-wrap gap-2">
              {POPULAR_EQUIPMENT.map((eq) => (
                <Badge
                  key={eq}
                  variant={equipment.includes(eq) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() =>
                    setEquipment((prev) =>
                      prev.includes(eq)
                        ? prev.filter((e) => e !== eq)
                        : [...prev, eq]
                    )
                  }
                >
                  {eq}
                </Badge>
              ))}
              {equipment
                .filter((eq) => !POPULAR_EQUIPMENT.includes(eq))
                .map((eq) => (
                  <Badge
                    key={eq}
                    variant="default"
                    className="cursor-pointer bg-indigo-600 hover:bg-indigo-700"
                    onClick={() =>
                      setEquipment((prev) => prev.filter((e) => e !== eq))
                    }
                  >
                    {eq} &times;
                  </Badge>
                ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={customEq}
                onChange={(e) => setCustomEq(e.target.value)}
                placeholder="Добави друг уред..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customEq.trim()) {
                    e.preventDefault();
                    if (!equipment.includes(customEq.trim())) {
                      setEquipment([...equipment, customEq.trim()]);
                    }
                    setCustomEq("");
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  if (customEq.trim() && !equipment.includes(customEq.trim())) {
                    setEquipment([...equipment, customEq.trim()]);
                    setCustomEq("");
                  }
                }}
              >
                Добави
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Предварителни умения (Prerequisites)</Label>
            <div className="mb-2 flex flex-wrap gap-2">
              {POPULAR_PREREQUISITES.map((req) => (
                <Badge
                  key={req}
                  variant={prerequisites.includes(req) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() =>
                    setPrerequisites((prev) =>
                      prev.includes(req)
                        ? prev.filter((r) => r !== req)
                        : [...prev, req]
                    )
                  }
                >
                  {req}
                </Badge>
              ))}
              {prerequisites
                .filter((req) => !POPULAR_PREREQUISITES.includes(req))
                .map((req) => (
                  <Badge
                    key={req}
                    variant="default"
                    className="cursor-pointer bg-emerald-600 hover:bg-emerald-700"
                    onClick={() =>
                      setPrerequisites((prev) => prev.filter((r) => r !== req))
                    }
                  >
                    {req} &times;
                  </Badge>
                ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={customReq}
                onChange={(e) => setCustomReq(e.target.value)}
                placeholder="Добави друго умение..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customReq.trim()) {
                    e.preventDefault();
                    if (!prerequisites.includes(customReq.trim())) {
                      setPrerequisites([...prerequisites, customReq.trim()]);
                    }
                    setCustomReq("");
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  if (
                    customReq.trim() &&
                    !prerequisites.includes(customReq.trim())
                  ) {
                    setPrerequisites([...prerequisites, customReq.trim()]);
                    setCustomReq("");
                  }
                }}
              >
                Добави
              </Button>
            </div>
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
