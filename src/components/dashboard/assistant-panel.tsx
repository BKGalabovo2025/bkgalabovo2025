'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AssistantPanel() {
  const [isSending, setIsSending] = useState(false);

  const handleSendReminders = async () => {
    console.log('handleSendReminders called!'); // Added for absolute certainty
    setIsSending(true);
    toast.info("Започва изпращане на напомняния...");

    try {
      const response = await fetch('/api/send-reminders', {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Неуспешно изпращане на напомнянията.');
      }
      
      // Correctly display the success message from the API response
      toast.success(result.message || "Напомнянията са изпратени успешно.");

    } catch (error) {
      console.error("Failed to send reminders:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Възникна неочаквана грешка.");
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-900">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <CardTitle>Асистент</CardTitle>
        </div>
        <CardDescription>
          Автоматизирани действия за улеснение на управлението.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4">
            <Button onClick={handleSendReminders} disabled={isSending}>
                {isSending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Изпращане...</>
                ) : (
                    'Изпрати напомняния за неплатени такси'
                )}
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
