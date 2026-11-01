"use client";

import { Contact as FamilyIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { CreateFamilyDialog } from "@/components/families/CreateFamilyDialog";
import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFamilies } from "@/hooks/useFamilies";
import { Member } from "@/types";

interface MembersFamiliesViewProps {
  initialMembers: Member[];
}

export function MembersFamiliesView({
  initialMembers,
}: MembersFamiliesViewProps) {
  const router = useRouter();
  const { families } = useFamilies();

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4 animate-in fade-in duration-300">
        <BentoCard className="flex items-center gap-3.5 rounded-2xl border border-zinc-200/80 bg-white p-3.5 sm:p-4 shadow-none dark:border-zinc-800 dark:bg-zinc-950">
          <div className="shrink-0 rounded-xl bg-zinc-100 p-2.5 text-zinc-600 sm:p-3 dark:bg-zinc-800 dark:text-zinc-300">
            <FamilyIcon className="size-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase sm:text-[11px]">
              Относно Семейните профили
            </p>
            <p className="text-xs leading-relaxed font-light text-zinc-500">
              Семейните профили обединяват родители и деца в обща група за
              по-лесно управление. Позволяват споделяне на семейни отстъпки и
              единна финансова история.
            </p>
          </div>
        </BentoCard>

        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {families.map((family) => {
            const familyMembers = initialMembers.filter((m) =>
              family.memberIds.includes(m.id)
            );
            return (
              <BentoCard
                key={family.id}
                className="space-y-3 rounded-2xl border border-zinc-200/80 bg-white p-3.5 sm:p-4 shadow-none dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-xl bg-zinc-100 p-2 dark:bg-zinc-800">
                      <FamilyIcon className="size-4.5 text-zinc-600 dark:text-zinc-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                      {family.name || "Семеен профил"}
                    </h3>
                  </div>
                  <Badge
                    variant="outline"
                    className="rounded-lg text-[10px] font-medium tracking-wider uppercase tabular-nums"
                  >
                    {familyMembers.length}{" "}
                    {familyMembers.length === 1 ? "член" : "члена"}
                  </Badge>
                </div>

                <div className="min-h-16 space-y-1.5 border-t border-zinc-100/80 pt-2.5 dark:border-zinc-900">
                  {familyMembers.length > 0 ? (
                    familyMembers.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400"
                      >
                        <div className="size-1.5 rounded-full bg-emerald-500" />
                        <span className="truncate">
                          {m.firstName} {m.lastName}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] font-light text-zinc-400">
                      Няма добавени членове в това семейство.
                    </p>
                  )}
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="mt-2 w-full rounded-xl text-[10px] font-semibold tracking-widest uppercase hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      onClick={() => router.push(`/families/${family.id}`)}
                    >
                      Детайли & Членове
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    Отваря пълната страница на семейството с финансова история и
                    списък на членовете.
                  </TooltipContent>
                </Tooltip>
              </BentoCard>
            );
          })}

          <CreateFamilyDialog />
        </div>
      </div>
    </TooltipProvider>
  );
}
