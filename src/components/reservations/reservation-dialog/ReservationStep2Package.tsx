"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useReservationDialog } from "./ReservationDialogContext";
import { cn } from "@/lib/utils";

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
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-2">
        ПРЕГЛЕД НА ВСИЧКИ ДНИ
      </h3>
      <p className="text-xs text-zinc-500">
        Системата автоматично попълва часовете и зоните за всички дни от пакета. Можете да ги промените при нужда.
      </p>
      {packageDays.map((pd, index) => (
        <div key={index} className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col gap-4">
          <div className="text-xs font-black text-cyan-600">ДЕН {pd.dayIndex + 1}</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Начален час</Label>
              <Input
                type="datetime-local"
                className="h-10 text-sm"
                value={
                  pd.startTime
                    ? new Date(pd.startTime.getTime() - pd.startTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
                    : ""
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  const newDays = [...packageDays];
                  const newStart = new Date(val);
                  newDays[index].startTime = newStart;
                  newDays[index].date = newStart;
                  if (services.find((s) => s.id === serviceId)?.durationMinutes) {
                    const dur = services.find((s) => s.id === serviceId)?.durationMinutes;
                    if (dur) newDays[index].endTime = new Date(newStart.getTime() + dur * 60000);
                  }
                  setPackageDays(newDays);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Краен час</Label>
              <Input
                type="datetime-local"
                className="h-10 text-sm"
                value={
                  pd.endTime
                    ? new Date(pd.endTime.getTime() - pd.endTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
                    : ""
                }
                readOnly
              />
            </div>
          </div>

          {isRecoveryZone && (
            <div className="space-y-4 pt-4 border-t border-zinc-200/50">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Зона за Клиент 1</Label>
                <div className="grid grid-cols-3 gap-2">
                  {services.find((s) => s.id === serviceId)?.zones?.map((zone) => (
                    <button
                      key={zone}
                      type="button"
                      onClick={() => {
                        const newDays = [...packageDays];
                        newDays[index].client1Zone = zone;
                        for (let k = index + 1; k < newDays.length; k++) {
                          if (!newDays[k].client1Zone) newDays[k].client1Zone = zone;
                        }
                        setPackageDays(newDays);
                      }}
                      className={cn(
                        "h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border",
                        pd.client1Zone === zone
                          ? "bg-cyan-600 border-cyan-600 text-white"
                          : "bg-white border-zinc-200 text-zinc-500"
                      )}
                    >
                      {zone}
                    </button>
                  ))}
                </div>
              </div>

              {isTwoClients && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Зона за Клиент 2</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {services.find((s) => s.id === serviceId)?.zones?.map((zone) => (
                      <button
                        key={zone}
                        type="button"
                        onClick={() => {
                          const newDays = [...packageDays];
                          newDays[index].client2Zone = zone;
                          for (let k = index + 1; k < newDays.length; k++) {
                            if (!newDays[k].client2Zone) newDays[k].client2Zone = zone;
                          }
                          setPackageDays(newDays);
                        }}
                        className={cn(
                          "h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border",
                          pd.client2Zone === zone
                            ? "bg-cyan-600 border-cyan-600 text-white"
                            : "bg-white border-zinc-200 text-zinc-500"
                        )}
                      >
                        {zone}
                      </button>
                    ))}
                  </div>
                  {(() => {
                    if (pd.client1Zone && pd.client2Zone && pd.client1Zone === pd.client2Zone) {
                      const zoneName = pd.client2Zone;
                      const z = zoneName?.toUpperCase();
                      const key = z === "КРАКА" ? "legs" : z === "РЪЦЕ" ? "arms" : "hips";
                      const maxQty = siteInfo?.inventory?.attachments?.[key] || 0;
                      if (maxQty < 2) {
                        return (
                          <p className="text-[11px] font-medium text-red-500 bg-red-500/10 p-2 rounded-lg mt-2">
                            Внимание: Разполагате само с {maxQty} приставка за {zoneName.toUpperCase()}. Моля, изберете различна зона за Клиент 2.
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
