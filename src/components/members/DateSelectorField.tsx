"use client";

import React, { useEffect, useRef, useState } from "react";

import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateSelectorFieldProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  name: string;
  label: string;
  yearCount: number;
}

const MONTHS = [
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

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseFieldDate(val: unknown): {
  raw: string;
  year: string;
  month: string;
  day: string;
} {
  if (!val) return { raw: "", year: "", month: "", day: "" };

  let valStr = "";
  if (typeof val === "string") {
    valStr = val.split("T")[0];
  } else if (
    val &&
    typeof (val as { toDate?: () => Date }).toDate === "function"
  ) {
    valStr = formatLocalDate((val as { toDate: () => Date }).toDate());
  } else if (val instanceof Date) {
    valStr = formatLocalDate(val);
  } else {
    valStr = String(val);
  }

  const parts = valStr.split("-");
  return {
    raw: valStr,
    year: parts[0] || "",
    month: parts[1] || "",
    day: parts[2] || "",
  };
}

function getDaysInMonth(yearStr: string, monthStr: string): number {
  if (!monthStr) return 31;
  const y = yearStr ? Number(yearStr) : 2024;
  const m = Number(monthStr);
  return new Date(y, m, 0).getDate();
}

interface DateSelectorInputsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: { value: unknown; onChange: (val: any) => void };
  label: string;
  years: string[];
}

function DateSelectorInputs({ field, label, years }: DateSelectorInputsProps) {
  const parsed = parseFieldDate(field.value);
  const [partial, setPartial] = useState<{
    year: string;
    month: string;
    day: string;
  } | null>(null);
  const lastEmittedRef = useRef<string | null>(null);

  useEffect(() => {
    if (parsed.raw !== lastEmittedRef.current) {
      setPartial(null);
      lastEmittedRef.current = null;
    }
  }, [parsed.raw]);

  const curYear = partial ? partial.year : parsed.year;
  const curMonth = partial ? partial.month : parsed.month;
  const curDay = partial ? partial.day : parsed.day;

  const daysCount = getDaysInMonth(curYear, curMonth);
  const days = Array.from({ length: daysCount }, (_, i) =>
    (i + 1).toString().padStart(2, "0")
  );

  const updateDate = (y: string, m: string, d: string) => {
    const nextM = m;
    let nextD = nextM ? d : "";

    if (nextM && nextD) {
      const maxDays = getDaysInMonth(y, nextM);
      if (Number(nextD) > maxDays) {
        nextD = "";
      }
    }

    if (!y && !nextM && !nextD) {
      setPartial(null);
      lastEmittedRef.current = "";
      field.onChange("");
      return;
    }

    if (y && nextM && nextD) {
      const fullDate = `${y}-${nextM}-${nextD}`;
      setPartial(null);
      lastEmittedRef.current = fullDate;
      field.onChange(fullDate);
      return;
    }

    // Incomplete date: keep in local partial state and do not persist partial strings
    setPartial({ year: y, month: nextM, day: nextD });
    if (parsed.raw !== "") {
      lastEmittedRef.current = "";
      field.onChange("");
    }
  };

  return (
    <FormItem className="flex flex-col">
      <div className="mt-0.5 mb-1.5 text-[10px] font-medium tracking-[0.2em] text-zinc-500 uppercase sm:text-[11px]">
        {label}
      </div>
      <div className="grid grid-cols-3 gap-2" role="group" aria-label={label}>
        <Select
          onValueChange={(v) =>
            updateDate(v === "none" ? "" : v, curMonth, curDay)
          }
          value={curYear || "none"}
        >
          <SelectTrigger
            aria-label={`${label} - Година`}
            className="h-11 rounded-xl border-zinc-100 bg-zinc-50/50 text-sm focus:bg-white focus:ring-0 sm:h-12 dark:border-zinc-800 dark:bg-zinc-900/50 dark:focus:bg-zinc-900"
          >
            <SelectValue placeholder="Година" />
          </SelectTrigger>
          <SelectContent className="max-h-75">
            <SelectItem value="none">Година</SelectItem>
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
          <SelectTrigger
            aria-label={`${label} - Месец`}
            className="h-11 rounded-xl border-zinc-100 bg-zinc-50/50 text-sm focus:bg-white focus:ring-0 sm:h-12 dark:border-zinc-800 dark:bg-zinc-900/50 dark:focus:bg-zinc-900"
          >
            <SelectValue placeholder="Месец" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Месец</SelectItem>
            {MONTHS.map((m) => (
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
          <SelectTrigger
            aria-label={`${label} - Ден`}
            className="h-11 rounded-xl border-zinc-100 bg-zinc-50/50 text-sm focus:bg-white focus:ring-0 sm:h-12 dark:border-zinc-800 dark:bg-zinc-900/50 dark:focus:bg-zinc-900"
          >
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

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <DateSelectorInputs field={field} label={label} years={years} />
      )}
    />
  );
}
