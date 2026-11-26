"use client";

import { Contact as FamilyIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

import { CreateFamilyDialog } from "@/components/families/CreateFamilyDialog";
import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { type Family, useFamilies } from "@/hooks/useFamilies";
import { Member } from "@/types";

interface MembersFamiliesViewProps {
  initialMembers: Member[];
  initialFamilies?: Family[];
}

export function MembersFamiliesView({
  initialMembers,
  initialFamilies,
}: MembersFamiliesViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { families } = useFamilies(initialFamilies);
  const membersMap = useMemo(
    () => new Map(initialMembers.map((m) => [m.id, m])),
    [initialMembers]
  );

  const isCreateFamilyOpen = searchParams?.get("action") === "create-family";

  const handleCreateFamilyOpenChange = useCallback(
    (open: boolean) => {
      const params = new URLSearchParams(searchParams?.toString() || "");
      if (open) {
        params.set("action", "create-family");
      } else {
        params.delete("action");
      }
      const query = params.toString() ? `?${params.toString()}` : "";
      router.replace(`${pathname}${query}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return (
    <div className="space-y-4">
      <BentoCard className="flex items-center gap-3.5 rounded-2xl border border-zinc-200/80 bg-white p-3.5 sm:p-4 shadow-none dark:border-zinc-800 dark:bg-zinc-950">
        <div className="shrink-0 rounded-xl bg-zinc-100 p-2.5 text-zinc-600 sm:p-3 dark:bg-zinc-800 dark:text-zinc-300">
          <FamilyIcon className="size-5" />
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold tracking-wider text-zinc-600 uppercase sm:text-[11px] dark:text-zinc-400">
            Относно Семейните профили
          </p>
          <p className="text-xs leading-relaxed font-light text-zinc-600 dark:text-zinc-400">
            Семейните профили обединяват родители и деца в обща група за
            по-лесно управление. Позволяват споделяне на семейни отстъпки и
            единна финансова история.
          </p>
        </div>
      </BentoCard>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
        {families.map((family) => {
          const familyMembers = family.memberIds
            .map((id) => membersMap.get(id))
            .filter((m): m is Member => Boolean(m));
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
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {family.name || "Семеен профил"}
                  </h2>
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
                  <p className="text-[11px] font-light text-zinc-600 dark:text-zinc-400">
                    Няма добавени членове в това семейство.
                  </p>
                )}
              </div>

              <Button
                variant="ghost"
                title="Отваря пълната страница на семейството с финансова история и списък на членовете."
                className="mt-2 w-full rounded-xl text-[10px] font-semibold tracking-widest uppercase hover:bg-zinc-50 dark:hover:bg-zinc-900"
                onClick={() => router.push(`/families/${family.id}`)}
              >
                Детайли & Членове
              </Button>
            </BentoCard>
          );
        })}

        <CreateFamilyDialog
          open={isCreateFamilyOpen}
          onOpenChange={handleCreateFamilyOpenChange}
        />
      </div>
    </div>
  );
}
