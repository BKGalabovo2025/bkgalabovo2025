"use client";

import { Calendar, Trash2, UserCog, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { deleteMemberAction } from "@/lib/actions/members";
import { Member } from "@/types";

interface MembersGuestsViewProps {
  initialMembers: Member[];
}

export function MembersGuestsView({ initialMembers }: MembersGuestsViewProps) {
  const router = useRouter();
  const { idToken } = useAuth();
  const [members, setMembers] = useState<Member[]>(initialMembers);

  const guestMembers = members.filter(
    (m) => m.isGuest || m.memberType === "guest"
  );

  const handleDeleteGuest = async (
    e: React.MouseEvent,
    id: string,
    name: string
  ) => {
    e.stopPropagation();
    if (!idToken) {
      toast.error("Грешка при оторизация");
      return;
    }

    if (!confirm(`Сигурни ли сте, че искате да изтриете гост ${name}?`)) return;

    const previousMembers = members;
    setMembers((prev) => prev.filter((m) => m.id !== id));

    try {
      const result = await deleteMemberAction(id, idToken);
      if (result.success) {
        toast.success("Гостът е изтрит");
        router.refresh();
      } else {
        setMembers(previousMembers);
        toast.error("Грешка", { description: result.message });
      }
    } catch (error) {
      console.error("Delete guest error:", error);
      setMembers(previousMembers);
      toast.error("Възникна сървърна грешка");
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Guest Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        <BentoCard className="flex items-center gap-3.5 rounded-2xl border border-zinc-200/80 bg-white p-3.5 sm:p-4 shadow-none dark:border-zinc-800 dark:bg-zinc-950">
          <div className="shrink-0 rounded-xl bg-amber-500/10 p-2.5 text-amber-600 sm:p-3">
            <UserCog className="size-5" strokeWidth={1.5} />
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-medium tracking-widest text-zinc-400 uppercase sm:text-[11px]">
              Външни клиенти
            </p>
            <p className="text-xl font-light text-amber-600 sm:text-2xl">
              {guestMembers.length}
            </p>
          </div>
        </BentoCard>

        <BentoCard className="flex items-center gap-3.5 rounded-2xl border border-zinc-200/80 bg-white p-3.5 sm:p-4 shadow-none sm:col-span-2 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="shrink-0 rounded-xl bg-zinc-100 p-2.5 text-zinc-500 sm:p-3 dark:bg-zinc-800">
            <UserPlus className="size-5" strokeWidth={1.5} />
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-medium tracking-widest text-zinc-400 uppercase sm:text-[11px]">
              Относно Външни клиенти
            </p>
            <p className="text-xs leading-relaxed font-light text-zinc-500">
              Външните клиенти са лица, участвали в тренировки или ползващи
              залата, но не са постоянни картотекирани членове на клуба. Те имат
              собствени досиета и история на посещенията.
            </p>
          </div>
        </BentoCard>
      </div>

      {/* Guest Cards */}
      <BentoCard className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-none dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between border-b border-zinc-100 p-4 sm:p-5 dark:border-zinc-900">
          <div className="flex items-center gap-2.5">
            <UserCog className="size-4 text-amber-500" strokeWidth={1.5} />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Регистрирани Външни клиенти
            </h3>
          </div>
          <Button
            onClick={() => router.push("/members/new?type=guest")}
            className="h-8.5 rounded-xl bg-amber-500 px-3.5 text-[10px] font-medium tracking-widest text-white uppercase shadow-none hover:bg-amber-600"
          >
            <UserPlus className="mr-1.5 size-3.5" /> Нов Гост
          </Button>
        </div>

        {guestMembers.length === 0 ? (
          <div className="p-12 text-center sm:p-16">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/20">
              <UserCog className="size-7 text-amber-400" strokeWidth={1.5} />
            </div>
            <p className="mb-2 text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
              Няма регистрирани външни клиенти
            </p>
            <p className="mx-auto max-w-sm text-xs leading-relaxed font-light text-zinc-400">
              Когато добавите външен клиент или гост, той ще се появи тук с
              пълно досие и история на посещенията.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
            {guestMembers
              .sort((a, b) =>
                `${a.firstName || ""} ${a.lastName || ""}`.localeCompare(
                  `${b.firstName || ""} ${b.lastName || ""}`,
                  "bg"
                )
              )
              .map((guest) => (
                <div
                  key={guest.id}
                  onClick={() => router.push(`/members/${guest.id}`)}
                  className="group cursor-pointer rounded-2xl border border-zinc-100 bg-white p-4 transition-all duration-300 hover:border-amber-200 hover:shadow-md hover:shadow-amber-500/5 dark:border-zinc-900 dark:bg-zinc-950 dark:hover:border-amber-900/50"
                >
                  <div className="mb-3.5 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9.5 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-sm font-medium text-amber-600 transition-colors group-hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400">
                        {(guest.firstName || "")[0]}
                        {(guest.lastName || "")[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                          {guest.firstName} {guest.lastName}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] font-light text-zinc-400">
                          {guest.email || "Няма въведен имейл"}
                        </p>
                      </div>
                    </div>
                    <Badge className="shrink-0 rounded-full border-none bg-amber-100 px-2.5 py-0.5 text-[9px] font-semibold tracking-widest text-amber-800 uppercase shadow-none dark:bg-amber-950/40 dark:text-amber-400">
                      Гост
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between border-t border-zinc-50 pt-2.5 text-zinc-400 dark:border-zinc-900">
                    <div className="flex items-center gap-1.5">
                      <Calendar
                        className="size-3 text-zinc-300"
                        strokeWidth={1.5}
                      />
                      <span className="text-[9px] font-medium tracking-widest uppercase">
                        {guest.registrationDate
                          ? new Date(guest.registrationDate).toLocaleDateString(
                              "bg-BG"
                            )
                          : "—"}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) =>
                        handleDeleteGuest(
                          e,
                          guest.id,
                          `${guest.firstName} ${guest.lastName}`
                        )
                      }
                      aria-label={`Изтрий ${guest.firstName} ${guest.lastName}`}
                      className="size-7 rounded-lg text-zinc-300 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30"
                    >
                      <Trash2 className="size-3.5" strokeWidth={1.5} />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </BentoCard>
    </div>
  );
}
