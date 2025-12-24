
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lightbulb, Loader2 } from "lucide-react";
import { AssistantMessage } from "@/types";

interface AssistantPanelProps {
  messages: AssistantMessage[];
  isLoading: boolean;
}

export default function AssistantPanel({ messages, isLoading }: AssistantPanelProps) {

  const getIconForType = (type: AssistantMessage['type']) => {
      switch(type) {
          case 'warning':
              return <Lightbulb className="h-5 w-5 text-red-500" />;
          case 'suggestion':
              return <Lightbulb className="h-5 w-5 text-blue-500" />;
          case 'info':
          default:
              return <Lightbulb className="h-5 w-5 text-amber-500 dark:text-amber-400" />;
      }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
            <div className="bg-amber-100 dark:bg-amber-900 p-2 rounded-full">
                 <Lightbulb className="h-6 w-6 text-amber-500 dark:text-amber-400" />
            </div>
            <div>
                <CardTitle>Препоръки от асистента</CardTitle>
                <CardDescription>Автоматично генерирани задачи и предложения.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex items-center justify-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : (
             <ul className="space-y-4">
                {(messages || []).map((msg) => (
                    <li key={msg.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div>{getIconForType(msg.type)}</div>
                        <div>
                            <p className="font-semibold text-sm mb-1">{msg.title}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{msg.description}</p>
                        </div>
                    </li>
                ))}
            </ul>
        )}
      </CardContent>
    </Card>
  );
}
