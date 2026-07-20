"use client";

import { useState, useEffect } from "react";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Activity, AlertCircle, Clock } from "lucide-react";
import { useReservationDialog } from "./ReservationDialogContext";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/currency";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderZoneWarning(selectedZone: string | undefined, client2Zone: string | undefined, siteInfo: any) {
  if (selectedZone && client2Zone && selectedZone === client2Zone) {
    const zoneName = client2Zone;
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
}

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
    checkWorkingHours,
  } = useReservationDialog();

  const { startTime, serviceId, selectedZone } = watchedValues;

  const [duration, setDuration] = useState<number>(1);

  useEffect(() => {
    if (!isRecoveryZone && startTime && duration > 0) {
      const newEndTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);
      if (!watchedValues.endTime || watchedValues.endTime.getTime() !== newEndTime.getTime()) {
        form.setValue("endTime", newEndTime);
      }
    }
  }, [startTime, duration, isRecoveryZone, form, watchedValues.endTime]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-2 gap-4">
        <DateTimePicker control={form.control} name="startTime" label="Начален час" />
        
        {isRecoveryZone ? (
          <DateTimePicker control={form.control} name="endTime" label="Краен час" disabled={true} />
        ) : (
          <FormItem>
            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
              <Clock className="w-3 h-3" /> Време (Часове)
            </FormLabel>
            <Input
              type="number"
              min="1"
              step="1"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
              className="h-14 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 focus-visible:ring-primary text-center font-bold"
            />
          </FormItem>
        )}
      </div>

      {!isRecoveryZone ? (
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="serviceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                  <Activity className="w-3 h-3" /> Изберете Услуга
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                  <SelectTrigger className="h-14 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 focus:ring-primary bg-white dark:bg-zinc-950">
                    <SelectValue placeholder="Изберете услуга (напр. Наем на корт)..." />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} - {formatPrice(s.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

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
                      "relative h-16 rounded-2xl font-bold transition-all border-2 overflow-hidden flex flex-col items-center justify-center gap-1 group",
                      field.value === num
                        ? "bg-gradient-to-br from-primary to-primary/80 border-primary text-white shadow-xl shadow-primary/30 scale-105 ring-2 ring-primary/20 ring-offset-2 ring-offset-background"
                        : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-primary/50 hover:bg-primary/5"
                    )}
                  >
                    <MapPin className={cn("w-4 h-4 transition-transform", field.value === num ? "scale-110" : "group-hover:scale-110 group-hover:text-primary/70")} />
                    <span className="text-xs">Корт {num}</span>
                    
                    {field.value === num && (
                       <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-50" />
                    )}
                  </button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        </div>
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
                        {renderZoneWarning(selectedZone, field2.value, siteInfo)}
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
      {/* Bypass Working Hours Warning */}
      {startTime && checkWorkingHours(startTime) && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-4 rounded-2xl mt-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-amber-100 dark:bg-amber-900/40 text-amber-600 rounded-xl">
               <AlertCircle className="w-4 h-4" />
             </div>
             <div>
               <p className="text-xs font-bold text-amber-700 dark:text-amber-500 uppercase tracking-wide">Извън работно време</p>
               <p className="text-[10px] text-amber-600/80 dark:text-amber-600 max-w-[200px] sm:max-w-xs">{checkWorkingHours(startTime)}</p>
             </div>
          </div>
          
          <button
            type="button"
            role="switch"
            aria-checked={ignoreWorkingHoursWarning}
            onClick={() => setIgnoreWorkingHoursWarning(!ignoreWorkingHoursWarning)}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              ignoreWorkingHoursWarning ? "bg-amber-500" : "bg-zinc-200 dark:bg-zinc-800"
            )}
          >
            <span
              className={cn(
                "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
                ignoreWorkingHoursWarning ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>
      )}
    </div>
  );
};
