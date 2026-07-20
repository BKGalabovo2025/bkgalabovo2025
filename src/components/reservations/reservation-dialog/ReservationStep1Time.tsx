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
        <p className="mt-2 rounded-lg bg-red-500/10 p-2 text-[11px] font-medium text-red-500">
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
    <div className="space-y-6 duration-300 animate-in fade-in slide-in-from-right-4">
      <div className="grid grid-cols-2 gap-4">
        <DateTimePicker control={form.control} name="startTime" label="Начален час" />
        
        {isRecoveryZone ? (
          <DateTimePicker control={form.control} name="endTime" label="Краен час" disabled={true} />
        ) : (
          <FormItem>
            <FormLabel className="flex items-center gap-2 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
              <Clock className="size-3" /> Време (Часове)
            </FormLabel>
            <Input
              type="number"
              min="1"
              step="1"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
              className="h-14 rounded-2xl border-2 border-zinc-100 text-center font-bold focus-visible:ring-primary dark:border-zinc-800"
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
                <FormLabel className="flex items-center gap-2 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                  <Activity className="size-3" /> Изберете Услуга
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                  <SelectTrigger className="h-14 rounded-2xl border-2 border-zinc-100 bg-white focus:ring-primary dark:border-zinc-800 dark:bg-zinc-950">
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
                <FormLabel className="flex items-center gap-2 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                  <MapPin className="size-3" /> Изберете Корт
                </FormLabel>
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 6 }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => field.onChange(num)}
                    className={cn(
                      "group relative flex h-16 flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl border-2 font-bold transition-all",
                      field.value === num
                        ? "scale-105 border-primary bg-gradient-to-br from-primary to-primary/80 text-white shadow-xl ring-2 shadow-primary/30 ring-primary/20 ring-offset-2 ring-offset-background"
                        : "border-zinc-200 bg-white text-zinc-500 hover:border-primary/50 hover:bg-primary/5 dark:border-zinc-800 dark:bg-zinc-950"
                    )}
                  >
                    <MapPin className={cn("size-4 transition-transform", field.value === num ? "scale-110" : "group-hover:scale-110 group-hover:text-primary/70")} />
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
              <FormLabel className="flex items-center gap-2 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                <Activity className="size-3" /> Изберете Услуга
              </FormLabel>
              <div className="max-h-100 scrollbar-thin scrollbar-thumb-zinc-100 space-y-6 overflow-y-auto pr-2 dark:scrollbar-thumb-zinc-800">
                {Object.entries(groupedServices).map(([category, catServices]) => (
                  <div key={category} className="space-y-3">
                    <h3 className="pl-1 text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">{category}</h3>
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
                            "flex h-14 w-full items-center justify-between rounded-2xl border-2 px-5 font-bold transition-all",
                            field.value === s.id
                              ? "scale-1.02 border-primary bg-primary text-white shadow-lg shadow-primary/20"
                              : "border-zinc-100 bg-zinc-50 text-zinc-500 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900"
                          )}
                        >
                          <span className="text-xs tracking-tight uppercase">{s.name}</span>
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
              <div className="space-y-4 duration-300 animate-in slide-in-from-top-2">
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                    <Activity className="size-3" /> Коя зона ще се ползва? {isTwoClients ? "(КЛИЕНТ 1)" : ""}
                  </FormLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {availableZones.map((zone) => (
                      <button
                        key={zone}
                        type="button"
                        onClick={() => field.onChange(zone)}
                        className={cn(
                          "h-12 rounded-xl border-2 text-[10px] font-bold tracking-wider uppercase transition-all",
                          field.value === zone
                            ? "border-cyan-600 bg-cyan-600 text-white shadow-lg shadow-cyan-600/20"
                            : "border-zinc-100 bg-zinc-50 text-zinc-500 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900"
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
                        <FormLabel className="flex items-center gap-2 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                          <Activity className="size-3" /> Коя зона ще се ползва? (КЛИЕНТ 2)
                        </FormLabel>
                        <div className="grid grid-cols-3 gap-2">
                          {availableZones.map((zone) => (
                            <button
                              key={`client2-${zone}`}
                              type="button"
                              onClick={() => field2.onChange(zone)}
                              className={cn(
                                "h-12 rounded-xl border-2 text-[10px] font-bold tracking-wider uppercase transition-all",
                                field2.value === zone
                                  ? "border-cyan-600 bg-cyan-600 text-white shadow-lg shadow-cyan-600/20"
                                  : "border-zinc-100 bg-zinc-50 text-zinc-500 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900"
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
        <div className="mt-6 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
          <div className="flex items-center gap-3">
             <div className="rounded-xl bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/40">
               <AlertCircle className="size-4" />
             </div>
             <div>
               <p className="text-xs font-bold tracking-wide text-amber-700 uppercase dark:text-amber-500">Извън работно време</p>
               <p className="max-w-50 text-[10px] text-amber-600/80 sm:max-w-xs dark:text-amber-600">{checkWorkingHours(startTime)}</p>
             </div>
          </div>
          
          <button
            type="button"
            role="switch"
            aria-checked={ignoreWorkingHoursWarning}
            onClick={() => setIgnoreWorkingHoursWarning(!ignoreWorkingHoursWarning)}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
              ignoreWorkingHoursWarning ? "bg-amber-500" : "bg-zinc-200 dark:bg-zinc-800"
            )}
          >
            <span
              className={cn(
                "pointer-events-none block size-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
                ignoreWorkingHoursWarning ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>
      )}
    </div>
  );
};
