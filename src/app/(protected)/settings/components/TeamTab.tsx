import { Plus, Trash2, Users } from "lucide-react";

import { CoachPhotosManager } from "@/app/(protected)/settings/components/CoachPhotosManager";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSettingsStore } from "@/store/use-settings-store";

const inputClass =
  "h-11 rounded-xl border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-primary";

export function TeamTab() {
  const { formData, handleTherapistChange, addTherapist, removeTherapist } =
    useSettingsStore();

  const bkgData = formData["bkgalabovo"] || {};
  const rzData = formData["recoveryzone"] || {};

  return (
    <div className="grid grid-cols-1 gap-4">
      <BentoCard className="space-y-4 border-zinc-200/80 bg-white p-4.5 sm:p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Users className="size-5 text-primary" strokeWidth={1.5} />
            <h3 className="text-xl font-light text-zinc-900 sm:text-2xl dark:text-white">
              Екип (БК Гълъбово)
            </h3>
          </div>
          <Button
            variant="outline"
            onClick={() => addTherapist("bkgalabovo")}
            className="h-9 rounded-xl px-3.5 text-xs font-medium tracking-widest uppercase"
          >
            <Plus className="mr-1.5 size-3.5" /> Добави Член
          </Button>
        </div>

        <div className="space-y-4">
          {bkgData.therapists?.map((member, index) => (
            <div
              key={member.id}
              className="flex flex-col gap-4 rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 sm:p-4.5 dark:border-zinc-800 dark:bg-zinc-900/50"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Users className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-zinc-900 dark:text-white">
                      Член #{index + 1}
                    </h4>
                    <p className="text-[11px] text-zinc-500">ID: {member.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={member.isActive}
                      onCheckedChange={(c: boolean | "indeterminate") =>
                        handleTherapistChange(
                          "bkgalabovo",
                          index,
                          "isActive",
                          !!c
                        )
                      }
                    />
                    <span className="text-xs text-zinc-500">Активен</span>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => removeTherapist("bkgalabovo", index)}
                    className="size-8 p-0 text-red-500 hover:bg-red-500/10 hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
                <div>
                  <Label
                    htmlFor={`team-bkg-${index}-name`}
                    className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
                  >
                    Име и Фамилия
                  </Label>
                  <Input
                    id={`team-bkg-${index}-name`}
                    name={`team-bkg-${index}-name`}
                    value={member.name}
                    onChange={(e) =>
                      handleTherapistChange(
                        "bkgalabovo",
                        index,
                        "name",
                        e.target.value
                      )
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label
                    htmlFor={`team-bkg-${index}-role`}
                    className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
                  >
                    Роля/Позиция
                  </Label>
                  <Input
                    id={`team-bkg-${index}-role`}
                    name={`team-bkg-${index}-role`}
                    value={member.role || ""}
                    onChange={(e) =>
                      handleTherapistChange(
                        "bkgalabovo",
                        index,
                        "role",
                        e.target.value
                      )
                    }
                    className={inputClass}
                  />
                </div>
                <div className="md:col-span-2">
                  <CoachPhotosManager
                    coach={member}
                    onUpdateField={(field, val) =>
                      handleTherapistChange("bkgalabovo", index, field, val)
                    }
                    storageFolder="team/bkgalabovo"
                    idPrefix={`team-bkg-${index}`}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label
                    htmlFor={`team-bkg-${index}-bio`}
                    className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
                  >
                    Кратко Био
                  </Label>
                  <Textarea
                    id={`team-bkg-${index}-bio`}
                    name={`team-bkg-${index}-bio`}
                    value={member.bio || ""}
                    onChange={(e) =>
                      handleTherapistChange(
                        "bkgalabovo",
                        index,
                        "bio",
                        e.target.value
                      )
                    }
                    className={`${inputClass} min-h-20 py-2.5`}
                  />
                </div>
              </div>
            </div>
          ))}
          {(!bkgData.therapists || bkgData.therapists.length === 0) && (
            <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <p className="text-xs text-zinc-500">Няма добавени членове</p>
            </div>
          )}
        </div>
      </BentoCard>

      <BentoCard className="space-y-4 border-zinc-200/80 bg-white p-4.5 sm:p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Users className="size-5 text-[#00f2fe]" strokeWidth={1.5} />
            <h3 className="text-xl font-light text-zinc-900 sm:text-2xl dark:text-white">
              Екип (Recovery Zone)
            </h3>
          </div>
          <Button
            variant="outline"
            onClick={() => addTherapist("recoveryzone")}
            className="h-9 rounded-xl px-3.5 text-xs font-medium tracking-widest uppercase"
          >
            <Plus className="mr-1.5 size-3.5" /> Добави Терапевт
          </Button>
        </div>

        <div className="space-y-4">
          {rzData.therapists?.map((therapist, index) => (
            <div
              key={therapist.id}
              className="flex flex-col gap-4 rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 sm:p-4.5 dark:border-zinc-800 dark:bg-zinc-900/50"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-[#00f2fe]/10 text-[#00f2fe]">
                    <Users className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-zinc-900 dark:text-white">
                      Терапевт #{index + 1}
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      ID: {therapist.id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={therapist.isActive}
                      onCheckedChange={(c: boolean | "indeterminate") =>
                        handleTherapistChange(
                          "recoveryzone",
                          index,
                          "isActive",
                          !!c
                        )
                      }
                    />
                    <span className="text-xs text-zinc-500">Активен</span>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => removeTherapist("recoveryzone", index)}
                    className="size-8 p-0 text-red-500 hover:bg-red-500/10 hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
                <div>
                  <Label
                    htmlFor={`team-rz-${index}-name`}
                    className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
                  >
                    Име и Фамилия
                  </Label>
                  <Input
                    id={`team-rz-${index}-name`}
                    name={`team-rz-${index}-name`}
                    value={therapist.name}
                    onChange={(e) =>
                      handleTherapistChange(
                        "recoveryzone",
                        index,
                        "name",
                        e.target.value
                      )
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label
                    htmlFor={`team-rz-${index}-role`}
                    className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
                  >
                    Роля/Позиция
                  </Label>
                  <Input
                    id={`team-rz-${index}-role`}
                    name={`team-rz-${index}-role`}
                    value={therapist.role || ""}
                    onChange={(e) =>
                      handleTherapistChange(
                        "recoveryzone",
                        index,
                        "role",
                        e.target.value
                      )
                    }
                    className={inputClass}
                  />
                </div>
                <div className="md:col-span-2">
                  <CoachPhotosManager
                    coach={therapist}
                    onUpdateField={(field, val) =>
                      handleTherapistChange("recoveryzone", index, field, val)
                    }
                    storageFolder="team/recoveryzone"
                    idPrefix={`team-rz-${index}`}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label
                    htmlFor={`team-rz-${index}-bio`}
                    className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
                  >
                    Кратко Био
                  </Label>
                  <Textarea
                    id={`team-rz-${index}-bio`}
                    name={`team-rz-${index}-bio`}
                    value={therapist.bio || ""}
                    onChange={(e) =>
                      handleTherapistChange(
                        "recoveryzone",
                        index,
                        "bio",
                        e.target.value
                      )
                    }
                    className={`${inputClass} min-h-20 py-2.5`}
                  />
                </div>
              </div>
            </div>
          ))}
          {(!rzData.therapists || rzData.therapists.length === 0) && (
            <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <p className="text-xs text-zinc-500">Няма добавени терапевти</p>
            </div>
          )}
        </div>
      </BentoCard>
    </div>
  );
}
