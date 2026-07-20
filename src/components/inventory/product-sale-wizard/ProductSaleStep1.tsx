"use client";

import { useProductSaleWizard } from "./ProductSaleWizardContext";
import { User, Search, PlusCircle, Loader2, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Member } from "@/types";

// ── Sub-components to reduce complexity ──────────────────────────────────────

interface NewGuestFormProps {
  newGuestFirstName: string;
  setNewGuestFirstName: (v: string) => void;
  newGuestLastName: string;
  setNewGuestLastName: (v: string) => void;
  newGuestPhone: string;
  setNewGuestPhone: (v: string) => void;
  newGuestEmail: string;
  setNewGuestEmail: (v: string) => void;
  isSavingNewGuest: boolean;
  setShowNewGuestForm: (v: boolean) => void;
  handleCreateGuest: () => void;
}

const ProductSaleStep1NewGuestForm = ({
  newGuestFirstName, setNewGuestFirstName,
  newGuestLastName, setNewGuestLastName,
  newGuestPhone, setNewGuestPhone,
  newGuestEmail, setNewGuestEmail,
  isSavingNewGuest, setShowNewGuestForm,
  handleCreateGuest
}: NewGuestFormProps) => {
  return (
    <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/20 p-5 duration-300 animate-in fade-in dark:border-amber-900/35 dark:bg-amber-950/5">
      <h4 className="text-xs font-bold tracking-wider text-amber-800 uppercase dark:text-amber-400">Регистрация на Нов Външен клиент (Гост)</h4>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold text-zinc-500 uppercase">Име *</Label>
          <Input placeholder="Име" value={newGuestFirstName} onChange={(e) => setNewGuestFirstName(e.target.value)} className="h-10 rounded-xl border-zinc-200 text-xs" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold text-zinc-500 uppercase">Фамилия *</Label>
          <Input placeholder="Фамилия" value={newGuestLastName} onChange={(e) => setNewGuestLastName(e.target.value)} className="h-10 rounded-xl border-zinc-200 text-xs" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold text-zinc-500 uppercase">Телефон *</Label>
          <Input placeholder="Телефон" value={newGuestPhone} onChange={(e) => setNewGuestPhone(e.target.value)} className="h-10 rounded-xl border-zinc-200 text-xs" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold text-zinc-500 uppercase">Имейл</Label>
          <Input placeholder="Имейл (по избор)" value={newGuestEmail} onChange={(e) => setNewGuestEmail(e.target.value)} className="h-10 rounded-xl border-zinc-200 text-xs" />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" size="sm" disabled={isSavingNewGuest} onClick={() => setShowNewGuestForm(false)} className="rounded-xl text-xs">Отказ</Button>
        <Button type="button" size="sm" disabled={isSavingNewGuest} onClick={handleCreateGuest} className="rounded-xl bg-amber-500 text-xs text-white animate-in hover:bg-amber-600">
          {isSavingNewGuest && <Loader2 className="mr-1 size-3 animate-spin" />} Регистрирай и избери
        </Button>
      </div>
    </div>
  );
};

interface MemberListProps {
  clientTypeTab: "member" | "guest";
  filteredMembers: Member[];
  selectedMember: Member | null;
  setSelectedMember: (m: Member | null) => void;
}

const ProductSaleStep1MemberList = ({ clientTypeTab, filteredMembers, selectedMember, setSelectedMember }: MemberListProps) => {
  return (
    <div className="custom-scrollbar max-h-55 divide-y divide-zinc-50 overflow-y-auto rounded-2xl border border-zinc-100 dark:divide-zinc-900 dark:border-zinc-900">
      {filteredMembers.length > 0 ? (
        filteredMembers.map((member) => {
          const isSelected = selectedMember?.id === member.id;
          let btnBgClass = "hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-zinc-800 dark:text-zinc-200";
          let avatarBgClass = "bg-zinc-100 dark:bg-zinc-800 text-zinc-500";
          
          if (isSelected) {
            if (clientTypeTab === "guest") {
              btnBgClass = "bg-amber-500/10 text-amber-950 dark:bg-amber-950/20 dark:text-amber-300";
              avatarBgClass = "bg-amber-500 text-white";
            } else {
              btnBgClass = "bg-emerald-50 text-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-300";
              avatarBgClass = "bg-emerald-500 text-white";
            }
          }

          return (
            <button
              key={member.id}
              type="button"
              onClick={() => setSelectedMember(member)}
              className={`flex w-full items-center justify-between px-5 py-3.5 text-left text-sm font-light transition-colors ${btnBgClass}`}
            >
              <div className="flex items-center gap-3">
                <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold", avatarBgClass)}>
                  {member.firstName[0]}
                  {member.lastName[0]}
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">{member.firstName} {member.lastName}</span>
                  <span className="mt-0.5 text-[10px] font-light text-zinc-400">{member.phone || member.email || "Няма контакти"}</span>
                </div>
              </div>
              {isSelected && (
                <Check className={cn("size-4 shrink-0", clientTypeTab === "guest" ? "text-amber-500" : "text-emerald-500")} />
              )}
            </button>
          );
        })
      ) : (
        <div className="p-8 text-center text-xs font-light text-zinc-400">
          {clientTypeTab === "guest" ? "Няма регистрирани външни гости. Създайте нов гост от бутона вдясно!" : "Няма намерени членове по този критерий."}
        </div>
      )}
    </div>
  );
};

export const ProductSaleStep1 = () => {
  const {
    showNewGuestForm, setShowNewGuestForm,
    newGuestFirstName, setNewGuestFirstName,
    newGuestLastName, setNewGuestLastName,
    newGuestPhone, setNewGuestPhone,
    newGuestEmail, setNewGuestEmail,
    isSavingNewGuest, handleCreateGuest,
    clientTypeTab, setClientTypeTab,
    setSelectedMember, selectedMember,
    searchTerm, setSearchTerm,
    membersLoading, filteredMembers
  } = useProductSaleWizard();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-2 dark:border-zinc-900">
        <div className="flex items-center gap-2">
          <User className="size-4 text-emerald-500" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Избор на клиент</h3>
        </div>
      </div>

      {showNewGuestForm ? (
        <ProductSaleStep1NewGuestForm
          newGuestFirstName={newGuestFirstName}
          setNewGuestFirstName={setNewGuestFirstName}
          newGuestLastName={newGuestLastName}
          setNewGuestLastName={setNewGuestLastName}
          newGuestPhone={newGuestPhone}
          setNewGuestPhone={setNewGuestPhone}
          newGuestEmail={newGuestEmail}
          setNewGuestEmail={setNewGuestEmail}
          isSavingNewGuest={isSavingNewGuest}
          setShowNewGuestForm={setShowNewGuestForm}
          handleCreateGuest={handleCreateGuest}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900">
            <button
              type="button"
              onClick={() => { setClientTypeTab("member"); setSelectedMember(null); }}
              className={cn(
                "flex-1 rounded-lg py-2 text-[10px] font-semibold tracking-widest uppercase transition-all",
                clientTypeTab === "member" ? "bg-white font-bold text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white" : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              Клубни членове
            </button>
            <button
              type="button"
              onClick={() => { setClientTypeTab("guest"); setSelectedMember(null); }}
              className={cn(
                "flex-1 rounded-lg py-2 text-[10px] font-semibold tracking-widest uppercase transition-all",
                clientTypeTab === "guest" ? "bg-white font-bold text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white" : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              Външни клиенти (Гости)
            </button>
          </div>

          <div className="flex gap-2">
            <div className="group relative flex-1">
              <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-emerald-500" strokeWidth={1.5} />
              <Input
                placeholder={clientTypeTab === "guest" ? "Търсене на външен гост..." : "Търсене на член по име..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 rounded-xl border-zinc-200 pl-11 focus-visible:border-emerald-500 focus-visible:ring-emerald-500"
              />
            </div>
            {clientTypeTab === "guest" && (
              <Button type="button" onClick={() => setShowNewGuestForm(true)} className="h-11 shrink-0 rounded-xl bg-amber-500 px-4 text-[10px] font-semibold tracking-wider text-white uppercase shadow-none hover:bg-amber-600">
                <PlusCircle className="mr-1.5 size-4" /> Нов Гост
              </Button>
            )}
          </div>

          {membersLoading ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-16">
              <Loader2 className="size-8 animate-spin text-emerald-500 opacity-30" />
              <p className="text-xs font-light text-zinc-400">Зареждане на списъка...</p>
            </div>
          ) : (
            <ProductSaleStep1MemberList
              clientTypeTab={clientTypeTab}
              filteredMembers={filteredMembers}
              selectedMember={selectedMember}
              setSelectedMember={setSelectedMember}
            />
          )}
        </div>
      )}
    </div>
  );
};
