import { Plus, Trash2, Users } from "lucide-react";

import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSettingsStore } from "@/store/use-settings-store";

const inputClass =
  "h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-primary";

export function TeamTab() {
  const { formData, handleTherapistChange, addTherapist, removeTherapist } =
    useSettingsStore();

  const bkgData = formData["bkgalabovo"] || {};
  const rzData = formData["recoveryzone"] || {};

  return (
    <div className="grid grid-cols-1 gap-6">
      <BentoCard className="space-y-8 border-zinc-100 bg-white p-10 dark:border-zinc-900 dark:bg-zinc-950">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Users className="size-5 text-primary" strokeWidth={1.5} />
            <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
              Екип (БК Гълъбово)
            </h3>
          </div>
          <Button
            variant="outline"
            onClick={() => addTherapist("bkgalabovo")}
            className="h-10 rounded-xl px-4 text-xs font-medium tracking-widest uppercase"
          >
            <Plus className="mr-2 size-4" /> Добави Член
          </Button>
        </div>

        <div className="space-y-6">
          {bkgData.therapists?.map((member, index) => (
            <div
              key={member.id}
              className="flex flex-col gap-6 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
                <div className="flex items-center gap-4">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Users className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-zinc-900 dark:text-white">
                      Член #{index + 1}
                    </h4>
                    <p className="text-xs text-zinc-500">ID: {member.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
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
                    className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <Label className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Име и Фамилия
                  </Label>
                  <Input
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
                  <Label className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Роля/Позиция
                  </Label>
                  <Input
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
                  <Label className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Снимка (URL)
                  </Label>
                  <Input
                    value={member.image || ""}
                    onChange={(e) =>
                      handleTherapistChange(
                        "bkgalabovo",
                        index,
                        "image",
                        e.target.value
                      )
                    }
                    className={inputClass}
                    placeholder="/team/member.jpg"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Кратко Био
                  </Label>
                  <Textarea
                    value={member.bio || ""}
                    onChange={(e) =>
                      handleTherapistChange(
                        "bkgalabovo",
                        index,
                        "bio",
                        e.target.value
                      )
                    }
                    className={`${inputClass} min-h-24 py-4`}
                  />
                </div>
              </div>
            </div>
          ))}
          {(!bkgData.therapists || bkgData.therapists.length === 0) && (
            <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <p className="text-sm text-zinc-500">Няма добавени членове</p>
            </div>
          )}
        </div>
      </BentoCard>

      <BentoCard className="mt-6 space-y-8 border-zinc-100 bg-white p-10 dark:border-zinc-900 dark:bg-zinc-950">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Users className="size-5 text-[#00f2fe]" strokeWidth={1.5} />
            <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
              Екип (Recovery Zone)
            </h3>
          </div>
          <Button
            variant="outline"
            onClick={() => addTherapist("recoveryzone")}
            className="h-10 rounded-xl px-4 text-xs font-medium tracking-widest uppercase"
          >
            <Plus className="mr-2 size-4" /> Добави Терапевт
          </Button>
        </div>

        <div className="space-y-6">
          {rzData.therapists?.map((therapist, index) => (
            <div
              key={therapist.id}
              className="flex flex-col gap-6 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
                <div className="flex items-center gap-4">
                  <div className="flex size-10 items-center justify-center rounded-full bg-[#00f2fe]/10 text-[#00f2fe]">
                    <Users className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-zinc-900 dark:text-white">
                      Терапевт #{index + 1}
                    </h4>
                    <p className="text-xs text-zinc-500">ID: {therapist.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
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
                    className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <Label className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Име и Фамилия
                  </Label>
                  <Input
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
                  <Label className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Роля/Позиция
                  </Label>
                  <Input
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
                  <Label className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Снимка (URL)
                  </Label>
                  <Input
                    value={therapist.image || ""}
                    onChange={(e) =>
                      handleTherapistChange(
                        "recoveryzone",
                        index,
                        "image",
                        e.target.value
                      )
                    }
                    className={inputClass}
                    placeholder="/team/member.jpg"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Кратко Био
                  </Label>
                  <Textarea
                    value={therapist.bio || ""}
                    onChange={(e) =>
                      handleTherapistChange(
                        "recoveryzone",
                        index,
                        "bio",
                        e.target.value
                      )
                    }
                    className={`${inputClass} min-h-24 py-4`}
                  />
                </div>
              </div>
            </div>
          ))}
          {(!rzData.therapists || rzData.therapists.length === 0) && (
            <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <p className="text-sm text-zinc-500">Няма добавени терапевти</p>
            </div>
          )}
        </div>
      </BentoCard>
    </div>
  );
}
