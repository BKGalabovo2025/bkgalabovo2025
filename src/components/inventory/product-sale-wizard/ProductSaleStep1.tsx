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
    <div className="space-y-4 p-5 border border-amber-200 dark:border-amber-900/35 bg-amber-50/20 dark:bg-amber-950/5 rounded-2xl animate-in fade-in duration-300">
      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">Регистрация на Нов Външен клиент (Гост)</h4>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase text-zinc-500">Име *</Label>
          <Input placeholder="Име" value={newGuestFirstName} onChange={(e) => setNewGuestFirstName(e.target.value)} className="h-10 rounded-xl border-zinc-200 text-xs" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase text-zinc-500">Фамилия *</Label>
          <Input placeholder="Фамилия" value={newGuestLastName} onChange={(e) => setNewGuestLastName(e.target.value)} className="h-10 rounded-xl border-zinc-200 text-xs" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase text-zinc-500">Телефон *</Label>
          <Input placeholder="Телефон" value={newGuestPhone} onChange={(e) => setNewGuestPhone(e.target.value)} className="h-10 rounded-xl border-zinc-200 text-xs" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase text-zinc-500">Имейл</Label>
          <Input placeholder="Имейл (по избор)" value={newGuestEmail} onChange={(e) => setNewGuestEmail(e.target.value)} className="h-10 rounded-xl border-zinc-200 text-xs" />
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="ghost" size="sm" disabled={isSavingNewGuest} onClick={() => setShowNewGuestForm(false)} className="rounded-xl text-xs">Отказ</Button>
        <Button type="button" size="sm" disabled={isSavingNewGuest} onClick={handleCreateGuest} className="rounded-xl text-xs bg-amber-500 hover:bg-amber-600 text-white animate-in">
          {isSavingNewGuest && <Loader2 className="h-3 w-3 animate-spin mr-1" />} Регистрирай и избери
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
    <div className="border border-zinc-100 dark:border-zinc-900 rounded-2xl max-h-[220px] overflow-y-auto divide-y divide-zinc-50 dark:divide-zinc-900 custom-scrollbar">
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
              className={`w-full text-left px-5 py-3.5 flex justify-between items-center transition-colors text-sm font-light ${btnBgClass}`}
            >
              <div className="flex items-center gap-3">
                <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-semibold shrink-0", avatarBgClass)}>
                  {member.firstName[0]}
                  {member.lastName[0]}
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">{member.firstName} {member.lastName}</span>
                  <span className="text-[10px] text-zinc-400 font-light mt-0.5">{member.phone || member.email || "Няма контакти"}</span>
                </div>
              </div>
              {isSelected && (
                <Check className={cn("h-4 w-4 shrink-0", clientTypeTab === "guest" ? "text-amber-500" : "text-emerald-500")} />
              )}
            </button>
          );
        })
      ) : (
        <div className="p-8 text-center text-zinc-400 text-xs font-light">
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
      <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-900">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-emerald-500" strokeWidth={1.5} />
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
          <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => { setClientTypeTab("member"); setSelectedMember(null); }}
              className={cn(
                "flex-1 py-2 text-[10px] font-semibold uppercase tracking-widest rounded-lg transition-all",
                clientTypeTab === "member" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm font-bold" : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              Клубни членове
            </button>
            <button
              type="button"
              onClick={() => { setClientTypeTab("guest"); setSelectedMember(null); }}
              className={cn(
                "flex-1 py-2 text-[10px] font-semibold uppercase tracking-widest rounded-lg transition-all",
                clientTypeTab === "guest" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm font-bold" : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              Външни клиенти (Гости)
            </button>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" strokeWidth={1.5} />
              <Input
                placeholder={clientTypeTab === "guest" ? "Търсене на външен гост..." : "Търсене на член по име..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 rounded-xl h-11 border-zinc-200 focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
              />
            </div>
            {clientTypeTab === "guest" && (
              <Button type="button" onClick={() => setShowNewGuestForm(true)} className="rounded-xl h-11 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-[10px] uppercase tracking-wider shrink-0 px-4 shadow-none">
                <PlusCircle className="mr-1.5 h-4 w-4" /> Нов Гост
              </Button>
            )}
          </div>

          {membersLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500 opacity-30" />
              <p className="text-zinc-400 text-xs font-light">Зареждане на списъка...</p>
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
