 
 
 
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

  const recoveryClients = members.filter((m) => m.isRecoveryMember || m.memberType === "recovery");

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
        <BentoCard className="flex items-center gap-4 rounded-4xl border border-zinc-100 bg-white p-5 shadow-none sm:gap-6 sm:rounded-5xl sm:p-8 dark:border-zinc-900 dark:bg-zinc-950">
          <div className="shrink-0 rounded-2xl bg-indigo-500/10 p-3.5 text-indigo-600 sm:p-4">
            <Activity className="size-5 sm:size-6" strokeWidth={1.5} />
          </div>
          <div className="space-y-0.5 sm:space-y-1">
            <p className="text-[10px] font-medium tracking-widest text-zinc-400 uppercase sm:text-[11px]">
              Клиенти на зоната
            </p>
            <p className="text-2xl font-light text-indigo-600 sm:text-3xl">
              {recoveryClients.length}
            </p>
          </div>
        </BentoCard>
        <BentoCard className="flex items-center gap-4 rounded-4xl border border-zinc-100 bg-white p-5 shadow-none sm:col-span-2 sm:gap-6 sm:rounded-5xl sm:p-8 dark:border-zinc-900 dark:bg-zinc-950">
          <div className="shrink-0 rounded-2xl bg-zinc-100 p-3.5 text-zinc-500 sm:p-4 dark:bg-zinc-800">
            <FileText className="size-5 sm:size-6" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-medium tracking-widest text-zinc-400 uppercase sm:text-[11px]">
              Относно Клиенти Възстановяване
            </p>
            <p className="text-xs leading-relaxed font-light text-zinc-500">
              Това са клиенти, които имат профил във Възстановителната зона. 
              Те могат да бъдат и външни лица, и клубни членове. Тук се съхранява 
              тяхното досие със здравна информация и история на процедурите.
            </p>
          </div>
        </BentoCard>
      </div>

      {/* Cards List */}
      <div className="rounded-4xl border border-zinc-100 bg-white shadow-none sm:rounded-5xl dark:border-zinc-900 dark:bg-zinc-950">
        <div className="flex items-center justify-between border-b border-zinc-50 p-4 sm:p-6 dark:border-zinc-900">
          <div className="flex items-center gap-3">
            <Activity className="size-4 text-indigo-500" strokeWidth={1.5} />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Регистрирани Клиенти
            </h3>
          </div>
          <Button
            onClick={() => router.push("/members/new?type=recovery")}
            className="h-9 rounded-xl bg-indigo-500 px-4 text-[10px] font-medium tracking-widest text-white uppercase shadow-none hover:bg-indigo-600"
          >
            <Plus className="mr-2 size-3.5" /> Нов Клиент
          </Button>
        </div>

        {recoveryClients.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/20">
              <Activity className="size-8 text-indigo-300" strokeWidth={1} />
            </div>
            <p className="mb-3 text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
              Няма регистрирани клиенти
            </p>
            <p className="mx-auto max-w-sm text-sm leading-relaxed font-light text-zinc-400">
              Все още няма добавени клиенти за зоната. Използвайте бутона горе,
              за да създадете първия профил.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 rounded-b-4xl bg-zinc-50/50 p-4 sm:grid-cols-2 sm:rounded-b-5xl sm:p-6 lg:grid-cols-3 dark:bg-zinc-950/50">
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
                  className="group cursor-pointer rounded-3xl border border-zinc-100 bg-white p-5 transition-all duration-300 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-800"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-medium text-indigo-600 transition-colors group-hover:bg-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400">
                        {client.firstName[0]}
                        {client.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">
                          {client.firstName} {client.lastName}
                        </p>
                        <p className="mt-0.5 text-[10px] font-light text-zinc-400">
                          {client.phone || client.email || "Няма контакти"}
                        </p>
                      </div>
                    </div>
                    <Badge className="shrink-0 rounded-full border-none bg-indigo-100 px-2.5 py-0.5 text-[9px] font-semibold tracking-widest text-indigo-700 uppercase shadow-none dark:bg-indigo-950/30 dark:text-indigo-400">
                      Зона
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 border-t border-zinc-50 pt-3 text-zinc-400 dark:border-zinc-800/50">
                    <Calendar
                      className="size-3 text-zinc-300"
                      strokeWidth={1.5}
                    />
                    <span className="text-[9px] font-medium tracking-widest uppercase">
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
                        className="size-7 rounded-lg text-zinc-300 transition-colors hover:bg-rose-50 hover:text-rose-500"
                      >
                        <Trash2 className="size-3.5" strokeWidth={1.5} />
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
