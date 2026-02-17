
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BellRing, AlertTriangle, XCircle } from "lucide-react";
import { Reminder } from "@/types";

interface RemindersCardProps {
  reminders: Reminder[];
}

const getReminderIcon = (type: Reminder['type']) => {
  switch (type) {
    case 'error':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    default:
      return <BellRing className="h-5 w-5 text-blue-500" />;
  }
};

// This function constructs the correct link based on the reminder type
const getReminderLink = (reminder: Reminder): string => {
  switch (reminder.type) {
    case 'payment':
      // Payment reminders should link to the member's detail page
      return `/members/${reminder.relatedId}`;
    // In the future, other reminder types can have their links constructed here
    // case 'inventory':
    //   return `/inventory/${reminder.relatedId}`;
    default:
      // Fallback for unknown types
      return '#';
  }
};

export function RemindersCard({ reminders }: RemindersCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Напомняния</CardTitle>
        <BellRing className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {reminders && reminders.length > 0 ? (
          <div className="space-y-4 mt-4">
            {reminders.map((reminder, index) => {
              const link = getReminderLink(reminder);
              return (
                <div key={`${reminder.id}-${index}`} className="flex items-start">
                  <div>{getReminderIcon(reminder.type)}</div>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{reminder.title}</p>
                    <p className="text-sm text-muted-foreground">{reminder.description}</p>
                    <Link href={link} className="text-sm text-muted-foreground hover:underline">
                      Преглед
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-4">Нямате нови напомняния.</p>
        )}
      </CardContent>
    </Card>
  );
}
