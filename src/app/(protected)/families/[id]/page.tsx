"use client";

import {
  Check,
  ChevronRight,
  Contact as FamilyIcon,
  Loader2,
  Pencil,
  PlusCircle,
  User,
  X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { AddMemberToFamilyDialog } from "@/components/families/AddMemberToFamilyDialog";
import { PageHeader } from "@/components/layout/page-header";
import { MemberSalesHistory } from "@/components/members/member-sales-history";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";
import { useFamily } from "@/hooks/useFamily";
import { removeMemberFromFamilyAction } from "@/lib/actions/families";
import { updateFamilyNameAction } from "@/lib/actions/families";

const FamilyDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const familyId = params.id as string;
  const { user } = useAuth();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [prevFamilyName, setPrevFamilyName] = useState("");

  const { family, members, loading, error, refetch } = useFamily(familyId);

  // Sync name when family data loads or changes
  if (family?.name && family.name !== prevFamilyName) {
    setPrevFamilyName(family.name);
    if (!isEditingName) {
      setNewName(family.name);
    }
  }

  const handleUpdateName = async () => {
    if (!user || !newName.trim() || newName === family?.name) {
      setIsEditingName(false);
      return;
    }

    setIsSavingName(true);
    try {
      const idToken = await user.getIdToken();
      const result = await updateFamilyNameAction(
        familyId,
        newName.trim(),
        idToken
      );
      if (result.success) {
        toast.success(result.message);
        setIsEditingName(false);
        refetch();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Възникна грешка.");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!user) return;
    if (
      !confirm(
        "Сигурни ли сте, че искате да премахнете този член от семейството?"
      )
    )
      return;

    setRemovingId(memberId);
    try {
      const idToken = await user.getIdToken();
      const result = await removeMemberFromFamilyAction(
        familyId,
        memberId,
        idToken
      );
      if (result.success) {
        toast.success(result.message);
        if (result.familyDeleted) {
          router.push("/members");
        } else {
          refetch();
        }
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Възникна грешка.");
    } finally {
      setRemovingId(null);
    }
  };

  if (loading)
    return (
      <div className="animate-pulse space-y-8 pb-12">
        <PageHeader
          title="Зареждане..."
          description="Моля изчакайте, докато заредим семейния профил."
          breadcrumbs={[
            { label: "Начало", href: "/dashboard" },
            { label: "Членове", href: "/members" },
            { label: "Семейство" },
          ]}
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Skeleton className="h-75 w-full rounded-5xl" />
          <Skeleton className="h-75 w-full rounded-5xl" />
        </div>
      </div>
    );

  if (error)
    return (
      <div className="p-8">
        <Alert
          variant="destructive"
          className="rounded-2xl border-none shadow-lg"
        >
          <AlertTitle className="font-black tracking-tight uppercase">
            Грешка
          </AlertTitle>
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      </div>
    );

  if (!family)
    return (
      <div className="p-8">
        <Alert className="rounded-2xl border-none shadow-lg">
          <AlertTitle className="font-black tracking-tight uppercase">
            Не е намерено семейство
          </AlertTitle>
          <AlertDescription className="font-medium">
            Няма семейство, съответстващо на това ID.
          </AlertDescription>
        </Alert>
      </div>
    );

  return (
    <div className="space-y-8 px-4 pb-12 duration-500 animate-in fade-in sm:px-0">
      <PageHeader
        title={family.name || "Семеен профил"}
        description={`Управление на членове и информация за семейство ${
          family.name || ""
        }.`}
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Членове", href: "/members" },
          { label: family.name || "Семейство" },
        ]}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Family Info */}
        <BentoCard className="h-fit space-y-6 rounded-5xl border border-zinc-100 bg-white p-8 shadow-none lg:col-span-1 dark:border-zinc-900 dark:bg-zinc-950">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="rounded-3xl bg-zinc-100 p-4 dark:bg-zinc-900">
              <FamilyIcon className="size-12 text-zinc-500" />
            </div>
            <div className="w-full">
              {isEditingName ? (
                <div className="flex items-center gap-2 px-4">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-9 rounded-xl border-zinc-100 bg-zinc-50/50 text-center font-bold transition-all focus:bg-white"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdateName();
                      if (e.key === "Escape") setIsEditingName(false);
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 rounded-full text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600"
                    onClick={handleUpdateName}
                    disabled={isSavingName}
                  >
                    {isSavingName ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Check className="size-4" />
                    )}
                  </Button>
                </div>
              ) : (
                <div className="group/title flex items-center justify-center gap-2">
                  <h2 className="text-2xl font-bold tracking-tight">
                    {family.name}
                  </h2>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 rounded-full text-zinc-400 opacity-0 transition-opacity group-hover/title:opacity-100 hover:bg-zinc-100 hover:text-zinc-600"
                    onClick={() => setIsEditingName(true)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                </div>
              )}
              <Badge
                variant="outline"
                className="mt-2 rounded-lg px-3 py-1 text-[10px] font-medium tracking-widest uppercase"
              >
                {members.length} ЧЛЕНА
              </Badge>
            </div>
          </div>

          <div className="border-t border-zinc-50 pt-6 dark:border-zinc-900">
            <h3 className="mb-4 text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
              Детайли
            </h3>
            <div className="space-y-4 text-sm font-medium">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">ID на семейството</span>
                <span className="font-mono text-[10px] text-zinc-900 dark:text-white">
                  {family.id}
                </span>
              </div>
            </div>
          </div>
        </BentoCard>

        <div className="space-y-6 lg:col-span-2">
          <div className="flex flex-col items-start justify-between gap-4 px-2 sm:flex-row sm:items-center">
            <h3 className="text-sm font-bold tracking-widest text-zinc-900 uppercase dark:text-white">
              Членове на семейството
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="hidden h-9 gap-2 rounded-full border-zinc-200 text-[10px] font-bold tracking-widest uppercase sm:flex"
                onClick={() =>
                  router.push(`/members/new?familyId=${family.id}`)
                }
              >
                <PlusCircle className="size-3.5" />
                Нов член
              </Button>
              <AddMemberToFamilyDialog
                familyId={family.id}
                existingMemberIds={family.memberIds || []}
                onSuccess={refetch}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {members.map((member) => (
              <BentoCard
                key={member.id}
                className="group flex cursor-pointer items-center justify-between rounded-3xl border border-zinc-100 bg-white p-6 shadow-none transition-all hover:bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                onClick={() => router.push(`/members/${member.id}`)}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="size-12 rounded-2xl border-2 border-white shadow-sm dark:border-zinc-800">
                    <AvatarImage src={member.avatarUrl || undefined} />
                    <AvatarFallback className="rounded-2xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
                      <User className="size-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-bold text-zinc-900 dark:text-white">
                      {member.firstName} {member.lastName}
                    </span>
                    <span className="text-[10px] font-medium tracking-widest text-zinc-400 uppercase">
                      {member.status === "active" ? "Активен" : "Неактивен"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 rounded-full text-rose-500 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600"
                    disabled={removingId !== null}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveMember(member.id);
                    }}
                  >
                    {removingId === member.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <X className="size-4" />
                    )}
                  </Button>
                  <ChevronRight className="size-5 text-zinc-300 transition-colors group-hover:text-zinc-900 dark:group-hover:text-white" />
                </div>
              </BentoCard>
            ))}
          </div>
        </div>
      </div>

      {/* Family Financial History */}
      <div className="space-y-6 pt-4">
        <h3 className="px-2 text-sm font-bold tracking-widest text-zinc-900 uppercase dark:text-white">
          Финансова история на семейството
        </h3>
        <BentoCard className="rounded-5xl border border-zinc-100 bg-white p-8 shadow-none dark:border-zinc-900 dark:bg-zinc-950">
          <MemberSalesHistory
            memberId={family.memberIds?.[0] || ""}
            memberIds={family.memberIds || []}
            familyMembers={members}
          />
        </BentoCard>
      </div>
    </div>
  );
};

export default FamilyDetailsPage;
