"use client";

import { Check, Loader2, PlusCircle, Search, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { createMemberAction } from "@/lib/actions/members";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";
import { Member } from "@/types";

import { useUnifiedSaleWizard } from "./UnifiedSaleWizardContext";

function getMemberButtonClass(
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

function getMemberAvatarClass(
  isSelected: boolean,
  clientTypeTab: "member" | "guest"
): string {
  const base =
    "h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-semibold shrink-0";
  if (!isSelected) return `${base} bg-zinc-100 dark:bg-zinc-800 text-zinc-500`;
  if (clientTypeTab === "guest") return `${base} bg-amber-500 text-white`;
  return `${base} bg-emerald-500 text-white`;
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export const UnifiedWizardStep1 = () => {
  const {
    showNewGuestForm,
    setShowNewGuestForm,
    clientTypeTab,
    setClientTypeTab,
    setSelectedMember,
    setIsGuestSale,
    newGuestFirstName,
    setNewGuestFirstName,
    newGuestLastName,
    setNewGuestLastName,
    newGuestPhone,
    setNewGuestPhone,
    newGuestEmail,
    setNewGuestEmail,
    isSavingNewGuest,
    setIsSavingNewGuest,
    searchTerm,
    setSearchTerm,
    membersLoading,
    filteredMembers,
    selectedMember,
    setMembers,
    setStep,
    mode,
  } = useUnifiedSaleWizard();

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
        // Guests bypass Step 2 (Attendance) only if mode requires attendance
        if (mode === "training" || mode === "recovery") {
          setStep(3);
        } else {
          setStep(2);
        }
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-2 dark:border-zinc-900">
        <div className="flex items-center gap-2">
          <User className="size-4 text-emerald-500" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            Избор на клиент
          </h3>
        </div>
      </div>

      {showNewGuestForm ? (
        <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/20 p-5 duration-300 animate-in fade-in dark:border-amber-900/35 dark:bg-amber-950/5">
          <h4 className="text-xs font-bold tracking-wider text-amber-800 uppercase dark:text-amber-400">
            Регистрация на Нов Външен клиент (Гост)
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-zinc-500 uppercase">
                Име *
              </Label>
              <Input
                placeholder="Име"
                value={newGuestFirstName}
                onChange={(e) => setNewGuestFirstName(e.target.value)}
                className="h-10 rounded-xl border-zinc-200 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-zinc-500 uppercase">
                Фамилия *
              </Label>
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
              <Label className="text-[10px] font-bold text-zinc-500 uppercase">
                Телефон *
              </Label>
              <Input
                placeholder="Телефон"
                value={newGuestPhone}
                onChange={(e) => setNewGuestPhone(e.target.value)}
                className="h-10 rounded-xl border-zinc-200 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-zinc-500 uppercase">
                Имейл
              </Label>
              <Input
                placeholder="Имейл (по избор)"
                value={newGuestEmail}
                onChange={(e) => setNewGuestEmail(e.target.value)}
                className="h-10 rounded-xl border-zinc-200 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
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
              className="rounded-xl bg-amber-500 text-xs text-white animate-in hover:bg-amber-600"
            >
              {isSavingNewGuest && (
                <Loader2 className="mr-1 size-3 animate-spin" />
              )}
              Регистрирай и избери
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900">
            <button
              type="button"
              onClick={() => {
                setClientTypeTab("member");
                setSelectedMember(null);
                setIsGuestSale(false);
              }}
              className={cn(
                "flex-1 rounded-lg py-2 text-[10px] font-semibold tracking-widest uppercase transition-all",
                clientTypeTab === "member"
                  ? "bg-white font-bold text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
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
                "flex-1 rounded-lg py-2 text-[10px] font-semibold tracking-widest uppercase transition-all",
                clientTypeTab === "guest"
                  ? "bg-white font-bold text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              Външни клиенти (Гости)
            </button>
          </div>

          <div className="flex gap-2">
            <div className="group relative flex-1">
              <Search
                className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-emerald-500"
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
                className="h-11 rounded-xl border-zinc-200 pl-11 focus-visible:border-emerald-500 focus-visible:ring-emerald-500"
              />
            </div>
            {clientTypeTab === "guest" && (
              <Button
                type="button"
                onClick={() => setShowNewGuestForm(true)}
                className="h-11 shrink-0 rounded-xl bg-amber-500 px-4 text-[10px] font-semibold tracking-wider text-white uppercase shadow-none hover:bg-amber-600"
              >
                <PlusCircle className="mr-1.5 size-4" /> Нов Гост
              </Button>
            )}
          </div>

          {membersLoading ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-16">
              <Loader2 className="size-8 animate-spin text-emerald-500 opacity-30" />
              <p className="text-xs font-light text-zinc-400">
                Зареждане на списъка...
              </p>
            </div>
          ) : (
            <div className="custom-scrollbar max-h-60 divide-y divide-zinc-50 overflow-y-auto rounded-2xl border border-zinc-100 dark:divide-zinc-900 dark:border-zinc-900">
              {filteredMembers.length === 0 ? (
                <div className="p-8 text-center text-xs font-light text-zinc-400">
                  {clientTypeTab === "guest"
                    ? "Няма регистрирани външни гости. Създайте нов гост от бутона вдясно!"
                    : "Няма намерени членове по този критерий."}
                </div>
              ) : (
                filteredMembers.map((member: Member) => {
                  const isSelected = selectedMember?.id === member.id;
                  const buttonClass = getMemberButtonClass(
                    isSelected,
                    clientTypeTab
                  );
                  const avatarClass = getMemberAvatarClass(
                    isSelected,
                    clientTypeTab
                  );

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
                          <span className="mt-0.5 text-[10px] font-light text-zinc-400">
                            {member.phone || member.email || "Няма контакти"}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <Check
                          className={cn(
                            "size-4 shrink-0",
                            clientTypeTab === "guest"
                              ? "text-amber-500"
                              : "text-emerald-500"
                          )}
                        />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
