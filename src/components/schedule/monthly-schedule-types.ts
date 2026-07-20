import * as z from "zod";

export const daysOfWeek = [
  { id: "mon", label: "Пн", value: 1 },
  { id: "tue", label: "Вт", value: 2 },
  { id: "wed", label: "Ср", value: 3 },
  { id: "thu", label: "Чт", value: 4 },
  { id: "fri", label: "Пт", value: 5 },
  { id: "sat", label: "Сб", value: 6 },
  { id: "sun", label: "Нд", value: 0 },
];

export const monthlyScheduleSchema = z
  .object({
    title: z.string().min(1, "Моля, въведете заглавие."),
    type: z.enum(["training", "competition", "camp", "event", "other"]),
    month: z.string().min(1, "Моля, изберете месец."),
    days: z.array(z.number()).min(1, "Моля, изберете поне един ден."),
    startTime: z.string().min(1, "Моля, въведете начален час."),
    endTime: z.string().min(1, "Моля, въведете краен час."),
    location: z.string().min(1, "Моля, въведете локация."),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "Крайният час трябва да е след началния.",
    path: ["endTime"],
  });

export type MonthlyScheduleFormData = z.infer<typeof monthlyScheduleSchema>;
