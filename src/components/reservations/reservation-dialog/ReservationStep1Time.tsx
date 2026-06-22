"use client";

import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { MapPin, Activity } from "lucide-react";
import { useReservationDialog } from "./ReservationDialogContext";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/currency";

export const ReservationStep1Time = () => {
  const {
    form,
    isRecoveryZone,
    groupedServices,
    watchedValues,
    services,
    isTwoClients,
    siteInfo,
    ignoreWorkingHoursWarning,
    setIgnoreWorkingHoursWarning,
  } = useReservationDialog();

  const { startTime, serviceId, selectedZone } = watchedValues;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-2 gap-4">
        <DateTimePicker control={form.control} name="startTime" label="Начален час" />
        <DateTimePicker control={form.control} name="endTime" label="Краен час" disabled={isRecoveryZone} />
      </div>

      {!isRecoveryZone ? (
        <FormField
          control={form.control}
          name="courtId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <MapPin className="w-3 h-3" /> Изберете Корт
              </FormLabel>
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 6 }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => field.onChange(num)}
                    className={cn(
                      "h-14 rounded-2xl font-bold transition-all border-2",
                      field.value === num
                        ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105"
                        : "bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300"
                    )}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <FormField
          control={form.control}
          name="serviceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <Activity className="w-3 h-3" /> Изберете Услуга
              </FormLabel>
              <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-100 dark:scrollbar-thumb-zinc-800">
                {Object.entries(groupedServices).map(([category, catServices]) => (
                  <div key={category} className="space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 pl-1">{category}</h3>
                    <div className="space-y-2">
                      {catServices.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            field.onChange(s.id);
                            if (startTime && s.durationMinutes) {
                              form.setValue("endTime", new Date(startTime.getTime() + s.durationMinutes * 60000));
                            }
                          }}
                          className={cn(
                            "w-full px-5 h-14 rounded-2xl font-bold transition-all border-2 flex items-center justify-between",
                            field.value === s.id
                              ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
                              : "bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300"
                          )}
                        >
                          <span className="text-xs uppercase tracking-tight">{s.name}</span>
                          <span className="text-[10px] opacity-70">
                            {s.durationMinutes} мин • {formatPrice(s.price)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Zone Selection for Recovery Zone */}
      {isRecoveryZone && serviceId && (
        <FormField
          control={form.control}
          name="selectedZone"
          render={({ field }) => {
            const selectedService = services.find((s) => s.id === serviceId);
            const availableZones = selectedService?.zones || [];

            if (availableZones.length <= 1) return <div className="hidden" />;

            return (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <Activity className="w-3 h-3" /> Коя зона ще се ползва? {isTwoClients ? "(КЛИЕНТ 1)" : ""}
                  </FormLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {availableZones.map((zone) => (
                      <button
                        key={zone}
                        type="button"
                        onClick={() => field.onChange(zone)}
                        className={cn(
                          "h-12 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border-2",
                          field.value === zone
                            ? "bg-cyan-600 border-cyan-600 text-white shadow-lg shadow-cyan-600/20"
                            : "bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300"
                        )}
                      >
                        {zone}
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>

                {isTwoClients && (
                  <FormField
                    control={form.control}
                    name="client2Zone"
                    render={({ field: field2 }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                          <Activity className="w-3 h-3" /> Коя зона ще се ползва? (КЛИЕНТ 2)
                        </FormLabel>
                        <div className="grid grid-cols-3 gap-2">
                          {availableZones.map((zone) => (
                            <button
                              key={`client2-${zone}`}
                              type="button"
                              onClick={() => field2.onChange(zone)}
                              className={cn(
                                "h-12 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border-2",
                                field2.value === zone
                                  ? "bg-cyan-600 border-cyan-600 text-white shadow-lg shadow-cyan-600/20"
                                  : "bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300"
                              )}
                            >
                              {zone}
                            </button>
                          ))}
                        </div>
                        <FormMessage />
                        {(() => {
                          if (selectedZone && field2.value && selectedZone === field2.value) {
                            const zoneName = field2.value;
                            const z = zoneName?.toUpperCase();
                            let key = "hips";
                            if (z === "КРАКА") {
                              key = "legs";
                            } else if (z === "РЪЦЕ") {
                              key = "arms";
                            }
                            const maxQty = siteInfo?.inventory?.attachments?.[key as keyof typeof siteInfo.inventory.attachments] || 0;
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
                      </FormItem>
                    )}
                  />
                )}
              </div>
            );
          }}
        />
      )}

      {/* Bypass Working Hours Checkbox */}
      <div className="flex items-center space-x-2 pt-4 border-t border-zinc-200/50">
        <input
          type="checkbox"
          id="ignoreWorkingHoursWarning"
          checked={ignoreWorkingHoursWarning}
          onChange={(e) => setIgnoreWorkingHoursWarning(e.target.checked)}
          className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-zinc-300"
        />
        <label
          htmlFor="ignoreWorkingHoursWarning"
          className="text-[11px] font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-600"
        >
          Игнорирай предупрежденията за извънработно време (маркирай, ако резервацията е потвърдена въпреки часа/деня)
        </label>
      </div>
    </div>
  );
};
