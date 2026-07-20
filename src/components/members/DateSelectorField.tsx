import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React from "react";

interface DateSelectorFieldProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  name: string;
  label: string;
  yearCount: number;
}

export function DateSelectorField({
  control,
  name,
  label,
  yearCount,
}: DateSelectorFieldProps) {
  const years = Array.from({ length: yearCount }, (_, i) =>
    (new Date().getFullYear() - i).toString()
  );
  const months = [
    { value: "01", label: "Януари" },
    { value: "02", label: "Февруари" },
    { value: "03", label: "Март" },
    { value: "04", label: "Април" },
    { value: "05", label: "Май" },
    { value: "06", label: "Юни" },
    { value: "07", label: "Юли" },
    { value: "08", label: "Август" },
    { value: "09", label: "Септември" },
    { value: "10", label: "Октомври" },
    { value: "11", label: "Ноември" },
    { value: "12", label: "Декември" },
  ];
  const days = Array.from({ length: 31 }, (_, i) =>
    (i + 1).toString().padStart(2, "0")
  );

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        let curYear = "";
        let curMonth = "";
        let curDay = "";

        if (field.value) {
          const val: unknown = field.value;
          let valStr = String(val);
          if (typeof val === "string") {
            valStr = val.split("T")[0];
          } else if (
            val &&
            typeof (val as { toDate?: () => Date }).toDate === "function"
          ) {
            valStr = (val as { toDate: () => Date })
              .toDate()
              .toISOString()
              .split("T")[0];
          } else if (val instanceof Date) {
            valStr = val.toISOString().split("T")[0];
          }
          const parts = valStr.split("-");
          curYear = parts[0] || "";
          curMonth = parts[1] || "";
          curDay = parts[2] || "";
        }

        const updateDate = (y: string, m: string, d: string) => {
          if (!y) {
            field.onChange(null);
            return;
          }
          let val = y;
          if (m) {
            val += `-${m}`;
            if (d) val += `-${d}`;
          }
          field.onChange(val);
        };

        return (
          <FormItem className="flex flex-col">
            <FormLabel className="mt-0.5 mb-1.5 text-[10px] font-medium tracking-[0.2em] text-zinc-500 uppercase sm:text-[11px]">
              {label}
            </FormLabel>
            <div className="grid grid-cols-3 gap-2">
              <Select
                onValueChange={(v) => updateDate(v, curMonth, curDay)}
                value={curYear || ""}
              >
                <SelectTrigger className="h-11 rounded-xl border-zinc-100 bg-zinc-50/50 text-sm focus:bg-white focus:ring-0 sm:h-12">
                  <SelectValue placeholder="Година" />
                </SelectTrigger>
                <SelectContent className="max-h-75">
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                onValueChange={(v) =>
                  updateDate(curYear, v === "none" ? "" : v, curDay)
                }
                value={curMonth || "none"}
              >
                <SelectTrigger className="h-11 rounded-xl border-zinc-100 bg-zinc-50/50 text-sm focus:bg-white focus:ring-0 sm:h-12">
                  <SelectValue placeholder="Месец" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Месец</SelectItem>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                onValueChange={(v) =>
                  updateDate(curYear, curMonth, v === "none" ? "" : v)
                }
                value={curDay || "none"}
                disabled={!curMonth}
              >
                <SelectTrigger className="h-11 rounded-xl border-zinc-100 bg-zinc-50/50 text-sm focus:bg-white focus:ring-0 sm:h-12">
                  <SelectValue placeholder="Ден" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ден</SelectItem>
                  {days.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
