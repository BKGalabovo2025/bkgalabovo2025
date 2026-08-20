import { Image as ImageIcon, Palette } from "lucide-react";

import { BentoCard } from "@/components/ui/bento-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettingsStore } from "@/store/use-settings-store";

const inputClass =
  "h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-primary";
const labelClass =
  "text-[11px] font-medium uppercase tracking-widest text-zinc-400";

export function BrandingTab() {
  const { formData, handleInputChange } = useSettingsStore();
  const bkgData = formData["bkgalabovo"] || {};
  const rzData = formData["recoveryzone"] || {};

  return (
    <div className="grid grid-cols-1 gap-6">
      <BentoCard className="space-y-8 border-zinc-100 bg-white p-10 dark:border-zinc-900 dark:bg-zinc-950">
        <div className="mb-2 flex items-center gap-4">
          <Palette className="size-5 text-primary" strokeWidth={1.5} />
          <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
            Брандиране и Цветове
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="space-y-3">
            <Label className={labelClass}>Лого на клуба (Светла тема)</Label>
            <div className="flex gap-4">
              <Input
                value={bkgData.logo || ""}
                onChange={(e) =>
                  handleInputChange("bkgalabovo", "logo", e.target.value)
                }
                placeholder="/icons/LOGO.jpg"
                className={inputClass}
              />
              <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                {bkgData.logo ? (
                  <img
                    src={bkgData.logo}
                    alt="Logo"
                    className="size-8 object-contain"
                  />
                ) : (
                  <ImageIcon className="size-5 text-zinc-400" />
                )}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <Label className={labelClass}>Лого на клуба (Тъмна тема)</Label>
            <div className="flex gap-4">
              <Input
                value={bkgData.logo || ""}
                onChange={(e) =>
                  handleInputChange("bkgalabovo", "logo", e.target.value)
                }
                placeholder="/icons/LOGO.jpg"
                className={inputClass}
              />
              <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-zinc-100 bg-zinc-900 dark:border-zinc-800">
                {bkgData.logo ? (
                  <img
                    src={bkgData.logo}
                    alt="Logo Dark"
                    className="size-8 object-contain"
                  />
                ) : (
                  <ImageIcon className="size-5 text-zinc-600" />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className={labelClass}>Лого Recovery Zone</Label>
            <div className="flex gap-4">
              <Input
                value={rzData.logo || ""}
                onChange={(e) =>
                  handleInputChange("recoveryzone", "logo", e.target.value)
                }
                placeholder="/recovery-logo.png"
                className={inputClass}
              />
              <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                {rzData.logo ? (
                  <img
                    src={rzData.logo}
                    alt="Recovery Logo"
                    className="size-8 object-contain"
                  />
                ) : (
                  <ImageIcon className="size-5 text-zinc-400" />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className={labelClass}>Основен Цвят (Primary)</Label>
            <div className="flex gap-4">
              <Input
                type="color"
                value={bkgData.primaryColor || "#0ea5e9"}
                onChange={(e) =>
                  handleInputChange(
                    "bkgalabovo",
                    "primaryColor",
                    e.target.value
                  )
                }
                className="size-14 shrink-0 cursor-pointer p-1"
              />
              <Input
                value={bkgData.primaryColor || "#0ea5e9"}
                onChange={(e) =>
                  handleInputChange(
                    "bkgalabovo",
                    "primaryColor",
                    e.target.value
                  )
                }
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </BentoCard>
    </div>
  );
}
