"use client";

import { useParams, useRouter } from "next/navigation";
import { useFamily } from "@/hooks/useFamily";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader } from "@/components/layout/page-header";
import { BentoCard } from "@/components/ui/bento-card";
import { Badge } from "@/components/ui/badge";
import {
  Contact as FamilyIcon,
  ChevronRight,
  User,
  X,
  Loader2,
  PlusCircle,
  Pencil,
  Check,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AddMemberToFamilyDialog } from "@/components/families/AddMemberToFamilyDialog";
import { removeMemberFromFamilyAction } from "@/lib/actions/families";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { updateFamilyNameAction } from "@/lib/actions/families";
import { Input } from "@/components/ui/input";
import { MemberSalesHistory } from "@/components/members/member-sales-history";

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
      <div className="space-y-8 animate-pulse pb-12">
        <PageHeader
          title="Зареждане..."
          description="Моля изчакайте, докато заредим семейния профил."
          breadcrumbs={[
            { label: "Начало", href: "/dashboard" },
            { label: "Членове", href: "/members" },
            { label: "Семейство" },
          ]}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[300px] w-full rounded-5xl" />
          <Skeleton className="h-[300px] w-full rounded-5xl" />
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
          <AlertTitle className="font-black uppercase tracking-tight">
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
          <AlertTitle className="font-black uppercase tracking-tight">
            Не е намерено семейство
          </AlertTitle>
          <AlertDescription className="font-medium">
            Няма семейство, съответстващо на това ID.
          </AlertDescription>
        </Alert>
      </div>
    );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 px-4 sm:px-0">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Family Info */}
        <BentoCard className="lg:col-span-1 p-8 space-y-6 border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 rounded-5xl shadow-none h-fit">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-3xl">
              <FamilyIcon className="h-12 w-12 text-zinc-500" />
            </div>
            <div className="w-full">
              {isEditingName ? (
                <div className="flex items-center gap-2 px-4">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-9 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white transition-all text-center font-bold"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdateName();
                      if (e.key === "Escape") setIsEditingName(false);
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                    onClick={handleUpdateName}
                    disabled={isSavingName}
                  >
                    {isSavingName ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 group/title">
                  <h2 className="text-2xl font-bold tracking-tight">
                    {family.name}
                  </h2>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full opacity-0 group-hover/title:opacity-100 transition-opacity text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
                    onClick={() => setIsEditingName(true)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
              <Badge
                variant="outline"
                className="mt-2 rounded-lg font-medium text-[10px] uppercase tracking-widest px-3 py-1"
              >
                {members.length} ЧЛЕНА
              </Badge>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-50 dark:border-zinc-900">
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">
              Детайли
            </h3>
            <div className="space-y-4 text-sm font-medium">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">ID на семейството</span>
                <span className="text-zinc-900 dark:text-white font-mono text-[10px]">
                  {family.id}
                </span>
              </div>
            </div>
          </div>
        </BentoCard>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-white">
              Членове на семейството
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="rounded-full gap-2 border-zinc-200 hidden sm:flex h-9 text-[10px] uppercase tracking-widest font-bold"
                onClick={() =>
                  router.push(`/members/new?familyId=${family.id}`)
                }
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Нов член
              </Button>
              <AddMemberToFamilyDialog
                familyId={family.id}
                existingMemberIds={family.memberIds || []}
                onSuccess={refetch}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members.map((member) => (
              <BentoCard
                key={member.id}
                className="p-6 flex items-center justify-between group hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all cursor-pointer border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 rounded-3xl shadow-none"
                onClick={() => router.push(`/members/${member.id}`)}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 rounded-2xl border-2 border-white dark:border-zinc-800 shadow-sm">
                    <AvatarImage src={member.avatarUrl || undefined} />
                    <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-2xl">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-bold text-zinc-900 dark:text-white">
                      {member.firstName} {member.lastName}
                    </span>
                    <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">
                      {member.status === "active" ? "Активен" : "Неактивен"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                    disabled={removingId !== null}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveMember(member.id);
                    }}
                  >
                    {removingId === member.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                  <ChevronRight className="h-5 w-5 text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                </div>
              </BentoCard>
            ))}
          </div>
        </div>
      </div>

      {/* Family Financial History */}
      <div className="space-y-6 pt-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-white px-2">
          Финансова история на семейството
        </h3>
        <BentoCard className="p-8 border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 rounded-5xl shadow-none">
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
