 
 
 
"use client";

import { useRouter } from "next/navigation";
import { Activity, Plus, Trash2, Calendar, FileText } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import { toast } from "sonner";
import { deleteMemberAction } from "@/lib/actions/members";
import { Member } from "@/types";

interface RecoveryClientsListProps {
  members?: Member[];
}

export function RecoveryClientsList({
  members = [],
}: RecoveryClientsListProps) {
  const router = useRouter();
  const { idToken } = useAuth();

  const recoveryClients = members.filter((m) => m.memberType === "recovery");

  const handleDeleteMember = async (
    e: React.MouseEvent,
    id: string,
    name: string
  ) => {
    e.stopPropagation();
    if (!idToken) return;
    if (!confirm(`Сигурни ли сте, че искате да изтриете клиент ${name}?`))
      return;

    try {
      const result = await deleteMemberAction(id, idToken);
      if (result.success) {
        toast.success("Клиентът е изтрит");
        router.refresh();
      } else {
        toast.error("Грешка", { description: result.message });
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Възникна сървърна грешка");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
        <BentoCard className="p-5 sm:p-8 flex items-center gap-4 sm:gap-6 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 shadow-none rounded-4xl sm:rounded-5xl">
          <div className="p-3.5 sm:p-4 bg-indigo-500/10 text-indigo-600 rounded-2xl shrink-0">
            <Activity className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />
          </div>
          <div className="space-y-0.5 sm:space-y-1">
            <p className="text-[10px] sm:text-[11px] font-medium text-zinc-400 uppercase tracking-widest">
              Клиенти на зоната
            </p>
            <p className="text-2xl sm:text-3xl font-light text-indigo-600">
              {recoveryClients.length}
            </p>
          </div>
        </BentoCard>
        <BentoCard className="p-5 sm:p-8 flex items-center gap-4 sm:gap-6 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 shadow-none rounded-4xl sm:rounded-5xl sm:col-span-2">
          <div className="p-3.5 sm:p-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-2xl shrink-0">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] sm:text-[11px] font-medium text-zinc-400 uppercase tracking-widest">
              Относно Клиенти Възстановяване
            </p>
            <p className="text-xs font-light text-zinc-500 leading-relaxed">
              Това са клиенти, които посещават само Зоната за Възстановяване. Те
              имат специално досие със здравна информация и история на
              процедурите.
            </p>
          </div>
        </BentoCard>
      </div>

      {/* Cards List */}
      <div className="border border-zinc-100 dark:border-zinc-900 shadow-none bg-white dark:bg-zinc-950 rounded-4xl sm:rounded-5xl">
        <div className="p-4 sm:p-6 border-b border-zinc-50 dark:border-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="h-4 w-4 text-indigo-500" strokeWidth={1.5} />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Регистрирани Клиенти
            </h3>
          </div>
          <Button
            onClick={() => router.push("/members/new?type=recovery")}
            className="rounded-xl font-medium text-[10px] uppercase tracking-widest bg-indigo-500 text-white hover:bg-indigo-600 h-9 px-4 shadow-none"
          >
            <Plus className="mr-2 h-3.5 w-3.5" /> Нов Клиент
          </Button>
        </div>

        {recoveryClients.length === 0 ? (
          <div className="p-16 text-center">
            <div className="h-16 w-16 bg-indigo-50 dark:bg-indigo-950/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Activity className="h-8 w-8 text-indigo-300" strokeWidth={1} />
            </div>
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-widest mb-3">
              Няма регистрирани клиенти
            </p>
            <p className="max-w-sm mx-auto text-sm font-light text-zinc-400 leading-relaxed">
              Все още няма добавени клиенти за зоната. Използвайте бутона горе,
              за да създадете първия профил.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 sm:p-6 bg-zinc-50/50 dark:bg-zinc-950/50 rounded-b-4xl sm:rounded-b-5xl">
            {recoveryClients
              .sort((a, b) =>
                `${a.firstName} ${a.lastName}`.localeCompare(
                  `${b.firstName} ${b.lastName}`,
                  "bg"
                )
              )
              .map((client) => (
                <div
                  key={client.id}
                  onClick={() => router.push(`/members/${client.id}`)}
                  className="group cursor-pointer bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-5 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-medium text-sm shrink-0 group-hover:bg-indigo-100 transition-colors">
                        {client.firstName[0]}
                        {client.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-zinc-900 dark:text-white">
                          {client.firstName} {client.lastName}
                        </p>
                        <p className="text-[10px] font-light text-zinc-400 mt-0.5">
                          {client.phone || client.email || "Няма контакти"}
                        </p>
                      </div>
                    </div>
                    <Badge className="rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest border-none shadow-none bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 shrink-0">
                      Зона
                    </Badge>
                  </div>
                  <div className="pt-3 border-t border-zinc-50 dark:border-zinc-800/50 flex items-center gap-2 text-zinc-400">
                    <Calendar
                      className="h-3 w-3 text-zinc-300"
                      strokeWidth={1.5}
                    />
                    <span className="text-[9px] font-medium uppercase tracking-widest">
                      {new Date(client.registrationDate).toLocaleDateString(
                        "bg-BG"
                      )}
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) =>
                          handleDeleteMember(
                            e,
                            client.id,
                            `${client.firstName} ${client.lastName}`
                          )
                        }
                        className="h-7 w-7 rounded-lg text-zinc-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
