"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { useReservationDialog } from "./ReservationDialogContext";

export const ReservationStep2Package = () => {
  const {
    packageDays,
    setPackageDays,
    services,
    watchedValues,
    isRecoveryZone,
    isTwoClients,
    siteInfo,
  } = useReservationDialog();

  const { serviceId } = watchedValues;

  return (
    <div className="space-y-6 duration-300 animate-in fade-in slide-in-from-right-4">
      <h3 className="mb-2 text-sm font-semibold tracking-wider text-zinc-800 uppercase dark:text-zinc-200">
        ПРЕГЛЕД НА ВСИЧКИ ДНИ
      </h3>
      <p className="text-xs text-zinc-500">
        Системата автоматично попълва часовете и зоните за всички дни от пакета.
        Можете да ги промените при нужда.
      </p>
      {packageDays.map((pd, index) => (
        <div
          key={index}
          className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="text-xs font-black text-cyan-600">
            ДЕН {pd.dayIndex + 1}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                Начален час
              </Label>
              <Input
                type="datetime-local"
                className="h-10 text-sm"
                value={
                  pd.startTime
                    ? new Date(
                        pd.startTime.getTime() -
                          pd.startTime.getTimezoneOffset() * 60000
                      )
                        .toISOString()
                        .slice(0, 16)
                    : ""
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  const newDays = [...packageDays];
                  const newStart = new Date(val);
                  newDays[index].startTime = newStart;
                  newDays[index].date = newStart;
                  if (
                    services.find((s) => s.id === serviceId)?.durationMinutes
                  ) {
                    const dur = services.find(
                      (s) => s.id === serviceId
                    )?.durationMinutes;
                    if (dur)
                      newDays[index].endTime = new Date(
                        newStart.getTime() + dur * 60000
                      );
                  }
                  setPackageDays(newDays);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                Краен час
              </Label>
              <Input
                type="datetime-local"
                className="h-10 text-sm"
                value={
                  pd.endTime
                    ? new Date(
                        pd.endTime.getTime() -
                          pd.endTime.getTimezoneOffset() * 60000
                      )
                        .toISOString()
                        .slice(0, 16)
                    : ""
                }
                readOnly
              />
            </div>
          </div>

          {isRecoveryZone && (
            <div className="space-y-4 border-t border-zinc-200/50 pt-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                  Зона за Клиент 1
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {services
                    .find((s) => s.id === serviceId)
                    ?.zones?.map((zone) => (
                      <button
                        key={zone}
                        type="button"
                        onClick={() => {
                          const newDays = [...packageDays];
                          newDays[index].client1Zone = zone;
                          for (let k = index + 1; k < newDays.length; k++) {
                            if (!newDays[k].client1Zone)
                              newDays[k].client1Zone = zone;
                          }
                          setPackageDays(newDays);
                        }}
                        className={cn(
                          "h-8 rounded-lg border text-[10px] font-bold tracking-wider uppercase transition-all",
                          pd.client1Zone === zone
                            ? "border-cyan-600 bg-cyan-600 text-white"
                            : "border-zinc-200 bg-white text-zinc-500"
                        )}
                      >
                        {zone}
                      </button>
                    ))}
                </div>
              </div>

              {isTwoClients && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                    Зона за Клиент 2
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {services
                      .find((s) => s.id === serviceId)
                      ?.zones?.map((zone) => (
                        <button
                          key={zone}
                          type="button"
                          onClick={() => {
                            const newDays = [...packageDays];
                            newDays[index].client2Zone = zone;
                            for (let k = index + 1; k < newDays.length; k++) {
                              if (!newDays[k].client2Zone)
                                newDays[k].client2Zone = zone;
                            }
                            setPackageDays(newDays);
                          }}
                          className={cn(
                            "h-8 rounded-lg border text-[10px] font-bold tracking-wider uppercase transition-all",
                            pd.client2Zone === zone
                              ? "border-cyan-600 bg-cyan-600 text-white"
                              : "border-zinc-200 bg-white text-zinc-500"
                          )}
                        >
                          {zone}
                        </button>
                      ))}
                  </div>
                  {(() => {
                    if (
                      pd.client1Zone &&
                      pd.client2Zone &&
                      pd.client1Zone === pd.client2Zone
                    ) {
                      const zoneName = pd.client2Zone;
                      const z = zoneName?.toUpperCase();
                      let key = "hips";
                      if (z === "КРАКА") {
                        key = "legs";
                      } else if (z === "РЪЦЕ") {
                        key = "arms";
                      }
                      const maxQty =
                        siteInfo?.inventory?.attachments?.[
                          key as keyof typeof siteInfo.inventory.attachments
                        ] || 0;
                      if (maxQty < 2) {
                        return (
                          <p className="mt-2 rounded-lg bg-red-500/10 p-2 text-[11px] font-medium text-red-500">
                            Внимание: Разполагате само с {maxQty} приставка за{" "}
                            {zoneName.toUpperCase()}. Моля, изберете различна
                            зона за Клиент 2.
                          </p>
                        );
                      }
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
