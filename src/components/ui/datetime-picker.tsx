 
 
 
import { formatDateTimeLocal } from "@/lib/date-utils";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Control, FieldPath, FieldValues } from "react-hook-form";

interface DateTimePickerProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  disabled?: boolean;
}

export function DateTimePicker<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  disabled,
}: DateTimePickerProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="datetime-local"
              disabled={disabled}
              value={formatDateTimeLocal(field.value)}
              onChange={(e) => {
                const val = e.target.value;
                field.onChange(val ? new Date(val) : undefined);
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
