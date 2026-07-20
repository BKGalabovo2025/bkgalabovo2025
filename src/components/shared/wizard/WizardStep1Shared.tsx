"use client";

/**
 * Shared sub-components for WizardStep1 (client selection).
 * Used by RecoveryWizardStep1 and TrainingWizardStep1 — they were 100% identical.
 */

import { Check, Loader2, Search, PlusCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createMemberAction } from "@/lib/actions/members";
import { useAuth } from "@/context/auth-context";
import { useAppStore } from "@/store/use-app-store";
import { Member } from "@/types";

// ── Pure styling helpers ──────────────────────────────────────────────────────

export function getMemberButtonClass(
  isSelected: boolean,
  clientTypeTab: "member" | "guest"
): string {
  const base =
    "w-full text-left px-5 py-3.5 flex justify-between items-center transition-colors text-sm font-light";
  if (!isSelected)
    return `${base} hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-zinc-800 dark:text-zinc-200`;
  if (clientTypeTab === "guest")
    return `${base} bg-amber-500/10 text-amber-950 dark:bg-amber-950/20 dark:text-amber-300`;
  return `${base} bg-emerald-50 text-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-300`;
}

export function getMemberAvatarClass(
  isSelected: boolean,
  clientTypeTab: "member" | "guest"
): string {
  const base =
    "h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-semibold shrink-0";
  if (!isSelected)
    return `${base} bg-zinc-100 dark:bg-zinc-800 text-zinc-500`;
  if (clientTypeTab === "guest") return `${base} bg-amber-500 text-white`;
  return `${base} bg-emerald-500 text-white`;
}

// ── New Guest Form ─────────────────────────────────────────────────────────────

interface NewGuestFormProps {
  newGuestFirstName: string;
  setNewGuestFirstName: (val: string) => void;
  newGuestLastName: string;
  setNewGuestLastName: (val: string) => void;
  newGuestPhone: string;
  setNewGuestPhone: (val: string) => void;
  newGuestEmail: string;
  setNewGuestEmail: (val: string) => void;
  isSavingNewGuest: boolean;
  setShowNewGuestForm: (val: boolean) => void;
  handleRegisterGuest: () => void;
}

export const WizardStep1NewGuestForm = ({
  newGuestFirstName,
  setNewGuestFirstName,
  newGuestLastName,
  setNewGuestLastName,
  newGuestPhone,
  setNewGuestPhone,
  newGuestEmail,
  setNewGuestEmail,
  isSavingNewGuest,
  setShowNewGuestForm,
  handleRegisterGuest,
}: NewGuestFormProps) => {
  return (
    <div className="space-y-4 p-5 border border-amber-200 dark:border-amber-900/35 bg-amber-50/20 dark:bg-amber-950/5 rounded-2xl animate-in fade-in duration-300">
      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
        Регистрация на Нов Външен клиент (Гост)
      </h4>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase text-zinc-500">Име *</Label>
          <Input
            placeholder="Име"
            value={newGuestFirstName}
            onChange={(e) => setNewGuestFirstName(e.target.value)}
            className="h-10 rounded-xl border-zinc-200 text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase text-zinc-500">Фамилия *</Label>
          <Input
            placeholder="Фамилия"
            value={newGuestLastName}
            onChange={(e) => setNewGuestLastName(e.target.value)}
            className="h-10 rounded-xl border-zinc-200 text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase text-zinc-500">Телефон *</Label>
          <Input
            placeholder="Телефон"
            value={newGuestPhone}
            onChange={(e) => setNewGuestPhone(e.target.value)}
            className="h-10 rounded-xl border-zinc-200 text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase text-zinc-500">Имейл</Label>
          <Input
            placeholder="Имейл (по избор)"
            value={newGuestEmail}
            onChange={(e) => setNewGuestEmail(e.target.value)}
            className="h-10 rounded-xl border-zinc-200 text-xs"
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isSavingNewGuest}
          onClick={() => setShowNewGuestForm(false)}
          className="rounded-xl text-xs"
        >
          Отказ
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={isSavingNewGuest}
          onClick={handleRegisterGuest}
          className="rounded-xl text-xs bg-amber-500 hover:bg-amber-600 text-white animate-in"
        >
          {isSavingNewGuest && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
          Регистрирай и избери
        </Button>
      </div>
    </div>
  );
};

// ── Member List ────────────────────────────────────────────────────────────────

interface MemberListProps {
  filteredMembers: Member[];
  selectedMember: Member | null;
  clientTypeTab: "member" | "guest";
  setSelectedMember: (member: Member) => void;
  setIsGuestSale: (val: boolean) => void;
}

export const WizardStep1MemberList = ({
  filteredMembers,
  selectedMember,
  clientTypeTab,
  setSelectedMember,
  setIsGuestSale,
}: MemberListProps) => {
  if (filteredMembers.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-400 text-xs font-light">
        {clientTypeTab === "guest"
          ? "Няма регистрирани външни гости. Създайте нов гост от бутона вдясно!"
          : "Няма намерени членове по този критерий."}
      </div>
    );
  }

  return (
    <>
      {filteredMembers.map((member: Member) => {
        const isSelected = selectedMember?.id === member.id;
        const buttonClass = getMemberButtonClass(isSelected, clientTypeTab);
        const avatarClass = getMemberAvatarClass(isSelected, clientTypeTab);

        return (
          <button
            key={member.id}
            type="button"
            onClick={() => {
              setSelectedMember(member);
              setIsGuestSale(member.isGuest || false);
            }}
            className={buttonClass}
          >
            <div className="flex items-center gap-3">
              <div className={avatarClass}>
                {member.firstName[0]}
                {member.lastName[0]}
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {member.firstName} {member.lastName}
                </span>
                <span className="text-[10px] text-zinc-400 font-light mt-0.5">
                  {member.phone || member.email || "Няма контакти"}
                </span>
              </div>
            </div>
            {isSelected && (
              <Check
                className={cn(
                  "h-4 w-4 shrink-0",
                  clientTypeTab === "guest" ? "text-amber-500" : "text-emerald-500"
                )}
              />
            )}
          </button>
        );
      })}
    </>
  );
};

// ── useRegisterGuest hook ─────────────────────────────────────────────────────
// Contains the shared guest registration logic used in both Step1 variants

interface UseRegisterGuestParams {
  newGuestFirstName: string;
  newGuestLastName: string;
  newGuestPhone: string;
  newGuestEmail: string;
  setIsSavingNewGuest: (val: boolean) => void;
  setMembers: (updater: (prev: Member[]) => Member[]) => void;
  setSelectedMember: (member: Member) => void;
  setIsGuestSale: (val: boolean) => void;
  setShowNewGuestForm: (val: boolean) => void;
  setNewGuestFirstName: (val: string) => void;
  setNewGuestLastName: (val: string) => void;
  setNewGuestPhone: (val: string) => void;
  setNewGuestEmail: (val: string) => void;
  setStep: React.Dispatch<React.SetStateAction<number>>;
}

export function useRegisterGuest({
  newGuestFirstName,
  newGuestLastName,
  newGuestPhone,
  newGuestEmail,
  setIsSavingNewGuest,
  setMembers,
  setSelectedMember,
  setIsGuestSale,
  setShowNewGuestForm,
  setNewGuestFirstName,
  setNewGuestLastName,
  setNewGuestPhone,
  setNewGuestEmail,
  setStep,
}: UseRegisterGuestParams) {
  const { idToken } = useAuth();
  const { activeBranch } = useAppStore();

  const handleRegisterGuest = async () => {
    if (!newGuestFirstName || !newGuestLastName || !newGuestPhone) {
      toast.error("Непълни данни", {
        description: "Моля, попълнете Име, Фамилия и Телефон на госта.",
      });
      return;
    }
    setIsSavingNewGuest(true);
    try {
      const result = await createMemberAction(idToken!, {
        firstName: newGuestFirstName,
        lastName: newGuestLastName,
        phone: newGuestPhone,
        email: newGuestEmail || "",
        isGuest: true,
        memberType: "guest",
        status: "active",
        siteId: activeBranch || "bkgalabovo",
      });

      if (result.success && result.data) {
        const newGuestObj: Member = {
          id: result.data.id,
          firstName: newGuestFirstName,
          lastName: newGuestLastName,
          name: `${newGuestFirstName} ${newGuestLastName}`,
          phone: newGuestPhone,
          email: newGuestEmail || "",
          isGuest: true,
          memberType: "guest",
          status: "active",
          siteId: activeBranch || "bkgalabovo",
          registrationDate: new Date().toISOString(),
        } as unknown as Member;

        setMembers((prev) => [newGuestObj, ...prev]);
        setSelectedMember(newGuestObj);
        setIsGuestSale(true);

        toast.success("Успех!", {
          description: "Външният клиент беше регистриран и избран успешно.",
        });

        setShowNewGuestForm(false);
        setNewGuestFirstName("");
        setNewGuestLastName("");
        setNewGuestPhone("");
        setNewGuestEmail("");
        setStep(3); // Guests bypass Step 2
      } else {
        toast.error("Грешка при регистрация", { description: result.message });
      }
    } catch (err) {
      console.error("Error creating quick guest:", err);
      toast.error("Системна грешка при регистрация.");
    } finally {
      setIsSavingNewGuest(false);
    }
  };

  return { handleRegisterGuest };
}

// ── WizardStep1Shell — shared layout UI ──────────────────────────────────────

interface WizardStep1ShellProps {
  showNewGuestForm: boolean;
  guestForm: React.ReactNode;
  clientTypeTab: "member" | "guest";
  setClientTypeTab: (tab: "member" | "guest") => void;
  setSelectedMember: (member: Member | null) => void;
  setIsGuestSale: (val: boolean) => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  setShowNewGuestForm: (val: boolean) => void;
  membersLoading: boolean;
  memberList: React.ReactNode;
}

export const WizardStep1Shell = ({
  showNewGuestForm,
  guestForm,
  clientTypeTab,
  setClientTypeTab,
  setSelectedMember,
  setIsGuestSale,
  searchTerm,
  setSearchTerm,
  setShowNewGuestForm,
  membersLoading,
  memberList,
}: WizardStep1ShellProps) => {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-900">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-emerald-500" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            Избор на клиент
          </h3>
        </div>
      </div>

      {showNewGuestForm ? (
        guestForm
      ) : (
        <div className="space-y-4">
          {/* Tab switcher */}
          <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => {
                setClientTypeTab("member");
                setSelectedMember(null);
                setIsGuestSale(false);
              }}
              className={cn(
                "flex-1 py-2 text-[10px] font-semibold uppercase tracking-widest rounded-lg transition-all",
                clientTypeTab === "member"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm font-bold"
                  : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              Клубни членове
            </button>
            <button
              type="button"
              onClick={() => {
                setClientTypeTab("guest");
                setSelectedMember(null);
                setIsGuestSale(true);
              }}
              className={cn(
                "flex-1 py-2 text-[10px] font-semibold uppercase tracking-widest rounded-lg transition-all",
                clientTypeTab === "guest"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm font-bold"
                  : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              Външни клиенти (Гости)
            </button>
          </div>

          {/* Search + New Guest button */}
          <div className="flex gap-2">
            <div className="relative flex-1 group">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-emerald-500 transition-colors"
                strokeWidth={1.5}
              />
              <Input
                placeholder={
                  clientTypeTab === "guest"
                    ? "Търсене на външен гост..."
                    : "Търсене на член по име..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 rounded-xl h-11 border-zinc-200 focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
              />
            </div>
            {clientTypeTab === "guest" && (
              <Button
                type="button"
                onClick={() => setShowNewGuestForm(true)}
                className="rounded-xl h-11 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-[10px] uppercase tracking-wider shrink-0 px-4 shadow-none"
              >
                <PlusCircle className="mr-1.5 h-4 w-4" /> Нов Гост
              </Button>
            )}
          </div>

          {/* Member list */}
          {membersLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500 opacity-30" />
              <p className="text-zinc-400 text-xs font-light">Зареждане на списъка...</p>
            </div>
          ) : (
            <div className="border border-zinc-100 dark:border-zinc-900 rounded-2xl max-h-[240px] overflow-y-auto divide-y divide-zinc-50 dark:divide-zinc-900 custom-scrollbar">
              {memberList}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
