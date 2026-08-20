import {
  Activity,
  CheckCircle2,
  Clock,
  HelpCircle,
  Plus,
  Shield,
  Trash2,
} from "lucide-react";

import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSettingsStore } from "@/store/use-settings-store";

const inputClassRz =
  "h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-[#00f2fe]";
const labelClass =
  "text-[11px] font-medium uppercase tracking-widest text-zinc-400";

export function RecoveryZoneTab() {
  const {
    formData,
    handleInputChange,
    handleScheduleChange,
    handleInventoryChange,
    handleStringArrayChange,
    addStringArrayItem,
    removeStringArrayItem,
    handleFaqChange,
    addFaq,
    removeFaq,
  } = useSettingsStore();

  const rzData = formData["recoveryzone"] || {};

  return (
    <div className="grid grid-cols-1 gap-6">
      <BentoCard className="space-y-8 border-zinc-100 bg-white p-10 dark:border-zinc-900 dark:bg-zinc-950">
        <div className="mb-6 flex items-center gap-4">
          <Activity className="size-5 text-[#00f2fe]" strokeWidth={1.5} />
          <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
            Обща информация за зоната
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="space-y-3 md:col-span-2">
            <Label className={labelClass}>Общо Описание</Label>
            <Textarea
              value={rzData.description || ""}
              onChange={(e) =>
                handleInputChange("recoveryzone", "description", e.target.value)
              }
              placeholder="Възстанови своите Сили..."
              className={`${inputClassRz} min-h-30 resize-y`}
            />
          </div>
          <div className="space-y-3">
            <Label className={labelClass}>Телефон</Label>
            <Input
              value={rzData.phone || ""}
              onChange={(e) =>
                handleInputChange("recoveryzone", "phone", e.target.value)
              }
              placeholder="+359 89 938 8338"
              className={inputClassRz}
            />
          </div>
          <div className="space-y-3">
            <Label className={labelClass}>Имейл</Label>
            <Input
              value={rzData.email || ""}
              onChange={(e) =>
                handleInputChange("recoveryzone", "email", e.target.value)
              }
              placeholder="office@recovery.bg"
              className={inputClassRz}
            />
          </div>
          <div className="space-y-3 md:col-span-2">
            <Label className={labelClass}>Адрес</Label>
            <Input
              value={rzData.address || ""}
              onChange={(e) =>
                handleInputChange("recoveryzone", "address", e.target.value)
              }
              placeholder="Спортна зала „Енергетик“, Гълъбово"
              className={inputClassRz}
            />
          </div>
          <div className="space-y-3">
            <Label className={labelClass}>Facebook Линк</Label>
            <Input
              value={rzData.facebook || ""}
              onChange={(e) =>
                handleInputChange("recoveryzone", "facebook", e.target.value)
              }
              placeholder="https://facebook.com/..."
              className={inputClassRz}
            />
          </div>
          <div className="space-y-3">
            <Label className={labelClass}>Instagram Линк</Label>
            <Input
              value={rzData.instagram || ""}
              onChange={(e) =>
                handleInputChange("recoveryzone", "instagram", e.target.value)
              }
              placeholder="https://instagram.com/..."
              className={inputClassRz}
            />
          </div>
          <div className="space-y-3">
            <Label className={labelClass}>YouTube Линк</Label>
            <Input
              value={rzData.youtube || ""}
              onChange={(e) =>
                handleInputChange("recoveryzone", "youtube", e.target.value)
              }
              placeholder="https://youtube.com/..."
              className={inputClassRz}
            />
          </div>
        </div>
      </BentoCard>

      <BentoCard className="space-y-8 border-zinc-100 bg-white p-10 dark:border-zinc-900 dark:bg-zinc-950">
        <div className="mb-6 flex items-center gap-4">
          <Activity className="size-5 text-[#00f2fe]" strokeWidth={1.5} />
          <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
            Инвентар & Оборудване
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="space-y-3">
            <Label className={labelClass}>Брой Компресори</Label>
            <Input
              type="number"
              min="0"
              value={rzData.inventory?.compressors || 0}
              onChange={(e) =>
                handleInventoryChange(
                  "recoveryzone",
                  "compressors",
                  parseInt(e.target.value) || 0
                )
              }
              className={inputClassRz}
            />
          </div>
          <div className="space-y-3">
            <Label className={labelClass}>Приставки &quot;ТАЗ&quot;</Label>
            <Input
              type="number"
              min="0"
              value={rzData.inventory?.attachments?.hips || 0}
              onChange={(e) =>
                handleInventoryChange(
                  "recoveryzone",
                  "hips",
                  parseInt(e.target.value) || 0
                )
              }
              className={inputClassRz}
            />
          </div>
          <div className="space-y-3">
            <Label className={labelClass}>Приставки &quot;КРАКА&quot;</Label>
            <Input
              type="number"
              min="0"
              value={rzData.inventory?.attachments?.legs || 0}
              onChange={(e) =>
                handleInventoryChange(
                  "recoveryzone",
                  "legs",
                  parseInt(e.target.value) || 0
                )
              }
              className={inputClassRz}
            />
          </div>
          <div className="space-y-3">
            <Label className={labelClass}>Приставки &quot;РЪЦЕ&quot;</Label>
            <Input
              type="number"
              min="0"
              value={rzData.inventory?.attachments?.arms || 0}
              onChange={(e) =>
                handleInventoryChange(
                  "recoveryzone",
                  "arms",
                  parseInt(e.target.value) || 0
                )
              }
              className={inputClassRz}
            />
          </div>
        </div>
      </BentoCard>

      <BentoCard className="mt-6 space-y-8 border-zinc-100 bg-white p-10 dark:border-zinc-900 dark:bg-zinc-950">
        <div className="mb-6 flex items-center gap-4">
          <Clock className="size-5 text-[#00f2fe]" strokeWidth={1.5} />
          <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
            Работно Време
          </h3>
        </div>
        <div className="space-y-4">
          {[
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ].map((day, i) => {
            const dayNames = [
              "Понеделник",
              "Вторник",
              "Сряда",
              "Четвъртък",
              "Петък",
              "Събота",
              "Неделя",
            ];
            const sched = rzData.schedule || {};
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const daySched = (sched as any)[day] || {
              open: "08:00",
              close: "22:00",
              isOpen: true,
            };

            return (
              <div
                key={day}
                className="flex items-center gap-6 rounded-xl border border-zinc-100 bg-zinc-50/30 p-4 dark:border-zinc-800 dark:bg-zinc-900/30"
              >
                <div className="w-32">
                  <Label
                    htmlFor={`rz-open-${day}`}
                    className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    {dayNames[i]}
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={`rz-open-${day}`}
                    checked={daySched.isOpen}
                    onCheckedChange={(c) =>
                      handleScheduleChange("recoveryzone", day, "isOpen", !!c)
                    }
                  />
                  <span className="w-16 text-[10px] font-bold text-zinc-400 uppercase">
                    {daySched.isOpen ? "Отворено" : "Затворено"}
                  </span>
                </div>
                {daySched.isOpen && (
                  <div className="flex flex-1 items-center justify-end gap-3">
                    <Input
                      type="time"
                      value={daySched.open}
                      onChange={(e) =>
                        handleScheduleChange(
                          "recoveryzone",
                          day,
                          "open",
                          e.target.value
                        )
                      }
                      className="h-10 w-32"
                    />
                    <span className="text-zinc-400">-</span>
                    <Input
                      type="time"
                      value={daySched.close}
                      onChange={(e) =>
                        handleScheduleChange(
                          "recoveryzone",
                          day,
                          "close",
                          e.target.value
                        )
                      }
                      className="h-10 w-32"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </BentoCard>

      <BentoCard className="mt-6 space-y-8 border-zinc-100 bg-white p-10 dark:border-zinc-900 dark:bg-zinc-950">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CheckCircle2 className="size-5 text-[#00f2fe]" strokeWidth={1.5} />
            <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
              Предимства (Секция &quot;База&quot;)
            </h3>
          </div>
          <Button
            variant="outline"
            onClick={() => addStringArrayItem("recoveryzone", "benefits")}
            className="h-10 rounded-xl px-4 text-xs font-medium tracking-widest uppercase"
          >
            <Plus className="mr-2 size-4" /> Добави Предимство
          </Button>
        </div>
        <div className="space-y-4">
          {rzData.benefits?.map((item, index) => {
            const value =
              typeof item === "string"
                ? item
                : (item as { title?: string }).title || "";
            return (
              <div key={index} className="flex items-center gap-4">
                <Input
                  value={value}
                  onChange={(e) =>
                    handleStringArrayChange(
                      "recoveryzone",
                      "benefits",
                      index,
                      e.target.value
                    )
                  }
                  placeholder="Напр. Специализирана зона за възстановяване..."
                  className={inputClassRz}
                />
                <Button
                  variant="ghost"
                  onClick={() =>
                    removeStringArrayItem("recoveryzone", "benefits", index)
                  }
                  className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            );
          })}
          {(!rzData.benefits || rzData.benefits.length === 0) && (
            <p className="text-sm font-light text-zinc-500">
              Няма въведени предимства.
            </p>
          )}
        </div>
      </BentoCard>

      <BentoCard className="mt-6 space-y-8 border-zinc-100 bg-white p-10 dark:border-zinc-900 dark:bg-zinc-950">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Shield className="size-5 text-red-500" strokeWidth={1.5} />
            <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
              Противопоказания
            </h3>
          </div>
          <Button
            variant="outline"
            onClick={() =>
              addStringArrayItem("recoveryzone", "contraindications")
            }
            className="h-10 rounded-xl px-4 text-xs font-medium tracking-widest uppercase"
          >
            <Plus className="mr-2 size-4" /> Добави Противопоказание
          </Button>
        </div>
        <div className="space-y-4">
          {rzData.contraindications?.map((item, index) => (
            <div key={index} className="flex items-center gap-4">
              <Input
                value={item as string}
                onChange={(e) =>
                  handleStringArrayChange(
                    "recoveryzone",
                    "contraindications",
                    index,
                    e.target.value
                  )
                }
                placeholder="Напр. Бременност..."
                className={inputClassRz}
              />
              <Button
                variant="ghost"
                onClick={() =>
                  removeStringArrayItem(
                    "recoveryzone",
                    "contraindications",
                    index
                  )
                }
                className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          {(!rzData.contraindications ||
            rzData.contraindications.length === 0) && (
            <p className="text-sm font-light text-zinc-500">
              Няма въведени противопоказания.
            </p>
          )}
        </div>
      </BentoCard>

      <BentoCard className="mt-6 space-y-8 border-zinc-100 bg-white p-10 dark:border-zinc-900 dark:bg-zinc-950">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <HelpCircle className="size-5 text-primary" strokeWidth={1.5} />
            <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
              Често Задавани Въпроси
            </h3>
          </div>
          <Button
            variant="outline"
            onClick={() => addFaq("recoveryzone")}
            className="h-10 rounded-xl px-4 text-xs font-medium tracking-widest uppercase"
          >
            <Plus className="mr-2 size-4" /> Добави Въпрос
          </Button>
        </div>
        <div className="space-y-4">
          {rzData.faqs?.map((faq, index) => (
            <div
              key={index}
              className="flex flex-col gap-4 rounded-xl border border-zinc-100 bg-zinc-50/50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50"
            >
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium tracking-widest text-zinc-500 uppercase">
                  Въпрос {index + 1}
                </Label>
                <Button
                  variant="ghost"
                  onClick={() => removeFaq("recoveryzone", index)}
                  className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <Input
                value={faq.q || ""}
                onChange={(e) =>
                  handleFaqChange("recoveryzone", index, "q", e.target.value)
                }
                placeholder="Въпрос..."
                className={inputClassRz}
              />
              <Textarea
                value={faq.a || ""}
                onChange={(e) =>
                  handleFaqChange("recoveryzone", index, "a", e.target.value)
                }
                placeholder="Отговор..."
                className={`${inputClassRz} min-h-20 resize-y`}
              />
            </div>
          ))}
          {(!rzData.faqs || rzData.faqs.length === 0) && (
            <p className="text-sm font-light text-zinc-500">
              Няма въведени въпроси.
            </p>
          )}
        </div>
      </BentoCard>
    </div>
  );
}
