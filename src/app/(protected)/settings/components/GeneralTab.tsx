import { Building2, Globe, Mail, MapPin, Phone } from "lucide-react";

import { InstagramIcon } from "@/components/icons/social-icons";
import { BentoCard } from "@/components/ui/bento-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettingsStore } from "@/store/use-settings-store";

const inputClass =
  "h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-primary";
const labelClass =
  "text-[11px] font-medium uppercase tracking-widest text-zinc-400";

export function GeneralTab() {
  const { formData, handleInputChange } = useSettingsStore();
  const bkgData = formData["bkgalabovo"] || {};

  return (
    <div className="grid grid-cols-1 gap-6">
      <BentoCard className="space-y-8 border-zinc-100 bg-white p-10 dark:border-zinc-900 dark:bg-zinc-950">
        <div className="mb-2 flex items-center gap-4">
          <Building2 className="size-5 text-primary" strokeWidth={1.5} />
          <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
            Информация за Клуба
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="space-y-3">
            <Label className={labelClass}>Име на клуба</Label>
            <Input
              value={bkgData.name || ""}
              onChange={(e) =>
                handleInputChange("bkgalabovo", "name", e.target.value)
              }
              className={inputClass}
            />
          </div>
          <div className="space-y-3">
            <Label className={labelClass}>
              <Mail className="mr-1 inline size-3" />
              Официален Имейл
            </Label>
            <Input
              value={bkgData.email || ""}
              onChange={(e) =>
                handleInputChange("bkgalabovo", "email", e.target.value)
              }
              className={inputClass}
            />
          </div>
          <div className="space-y-3">
            <Label className={labelClass}>
              <Phone className="mr-1 inline size-3" />
              Телефон за връзка
            </Label>
            <Input
              value={bkgData.phone || ""}
              onChange={(e) =>
                handleInputChange("bkgalabovo", "phone", e.target.value)
              }
              className={inputClass}
            />
          </div>
          <div className="space-y-3">
            <Label className={labelClass}>
              <Globe className="mr-1 inline size-3" />
              Уебсайт
            </Label>
            <Input
              value={bkgData.website || ""}
              onChange={(e) =>
                handleInputChange("bkgalabovo", "website", e.target.value)
              }
              placeholder="https://bkgalabovo.alle.bg/"
              className={inputClass}
            />
          </div>
          <div className="space-y-3 md:col-span-2">
            <Label className={labelClass}>
              <MapPin className="mr-1 inline size-3" />
              Адрес
            </Label>
            <Input
              value={bkgData.address || ""}
              onChange={(e) =>
                handleInputChange("bkgalabovo", "address", e.target.value)
              }
              placeholder="ул. Александър Стамболийски 41, 6280 Гълъбово, България"
              className={inputClass}
            />
          </div>
        </div>
        <div className="border-t border-zinc-50 pt-4 dark:border-zinc-900">
          <p className="mb-6 text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
            Социални мрежи
          </p>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="space-y-3">
              <Label className={labelClass}>
                <InstagramIcon className="mr-1 inline size-3 text-pink-500" />
                Instagram
              </Label>
              <Input
                value={bkgData.instagram || ""}
                onChange={(e) =>
                  handleInputChange("bkgalabovo", "instagram", e.target.value)
                }
                placeholder="https://www.instagram.com/badminton.galabovo/"
                className={inputClass}
              />
            </div>
            <div className="space-y-3">
              <Label className={labelClass}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1 inline size-3 text-blue-600"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
                Facebook Група
              </Label>
              <Input
                value={bkgData.facebookGroup || ""}
                onChange={(e) =>
                  handleInputChange(
                    "bkgalabovo",
                    "facebookGroup",
                    e.target.value
                  )
                }
                placeholder="https://www.facebook.com/groups/..."
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </BentoCard>
    </div>
  );
}
