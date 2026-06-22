"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { mutate } from "swr";
import { toast } from "sonner";
import { GeneralService, Member, Sale } from "@/types";
import { getAllMembers } from "@/services/member-service";
import { executeGeneralServiceSaleAction } from "@/lib/actions/general-services-server";
import { useAppStore } from "@/store/use-app-store";

interface GeneralWizardContextType {
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  isProcessing: boolean;
  completedSaleId: string | null;
  service: GeneralService;
  
  handleClose: () => void;
  handlePrevStep: () => void;
  handleNextStep: () => void;
  handleExecuteSale: () => Promise<void>;

  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  membersLoading: boolean;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  selectedMember: Member | null;
  setSelectedMember: React.Dispatch<React.SetStateAction<Member | null>>;
  
  clientTypeTab: "member" | "guest";
  setClientTypeTab: React.Dispatch<React.SetStateAction<"member" | "guest">>;
  showNewGuestForm: boolean;
  setShowNewGuestForm: React.Dispatch<React.SetStateAction<boolean>>;
  newGuestFirstName: string;
  setNewGuestFirstName: React.Dispatch<React.SetStateAction<string>>;
  newGuestLastName: string;
  setNewGuestLastName: React.Dispatch<React.SetStateAction<string>>;
  newGuestPhone: string;
  setNewGuestPhone: React.Dispatch<React.SetStateAction<string>>;
  newGuestEmail: string;
  setNewGuestEmail: React.Dispatch<React.SetStateAction<string>>;
  isSavingNewGuest: boolean;
  setIsSavingNewGuest: React.Dispatch<React.SetStateAction<boolean>>;
  filteredMembers: Member[];

  quantity: string;
  setQuantity: React.Dispatch<React.SetStateAction<string>>;
  price: string;
  setPrice: React.Dispatch<React.SetStateAction<string>>;
  paymentMethod: string;
  setPaymentMethod: React.Dispatch<React.SetStateAction<string>>;
  isPaid: boolean;
  setIsPaid: React.Dispatch<React.SetStateAction<boolean>>;
  note: string;
  setNote: React.Dispatch<React.SetStateAction<string>>;
  
  unitPrice: number;
  qty: number;
  totalAmount: number;
}

const GeneralWizardContext = createContext<GeneralWizardContextType | undefined>(undefined);

interface GeneralWizardProviderProps {
  children: ReactNode;
  service: GeneralService;
  isOpen: boolean;
  onClose: () => void;
  onSaleSuccess: () => void;
}

export const GeneralWizardProvider = ({
  children,
  service,
  isOpen,
  onClose,
  onSaleSuccess,
}: GeneralWizardProviderProps) => {
  const [step, setStep] = useState(1);
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const [clientTypeTab, setClientTypeTab] = useState<"member" | "guest">("member");
  const [showNewGuestForm, setShowNewGuestForm] = useState(false);
  const [newGuestFirstName, setNewGuestFirstName] = useState("");
  const [newGuestLastName, setNewGuestLastName] = useState("");
  const [newGuestPhone, setNewGuestPhone] = useState("");
  const [newGuestEmail, setNewGuestEmail] = useState("");
  const [isSavingNewGuest, setIsSavingNewGuest] = useState(false);

  // Form states
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState(service.price.toString());
  const [paymentMethod, setPaymentMethod] = useState("В брой");
  const [isPaid, setIsPaid] = useState(true);
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedSaleId, setCompletedSaleId] = useState<string | null>(null);

  const { activeBranch } = useAppStore();

  useEffect(() => {
    if (isOpen) {
      const fetchMembers = async () => {
        setMembersLoading(true);
        try {
          const fetchedMembers = await getAllMembers();
          setMembers(fetchedMembers);
        } catch (err) {
          console.error("Error loading members:", err);
          toast.error("Грешка", { description: "Неуспешно зареждане на клубните членове." });
        } finally {
          setMembersLoading(false);
        }
      };
      fetchMembers();

      setStep(1);
      setQuantity("1");
      setPrice(service.price.toString());
      setSelectedMember(null);
      setCompletedSaleId(null);
      setNote("");
      setClientTypeTab("member");
      setShowNewGuestForm(false);
      setNewGuestFirstName("");
      setNewGuestLastName("");
      setNewGuestPhone("");
      setNewGuestEmail("");
      setIsSavingNewGuest(false);
    }
  }, [isOpen, service]);

  const filteredMembers = members.filter((m) => {
    const isGuest = m.isGuest || m.memberType === "guest";
    const matchesTab = clientTypeTab === "guest" ? isGuest : !isGuest;
    if (!matchesTab) return false;

    const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const qty = parseInt(quantity, 10) || 1;
  const unitPrice = parseFloat(price) || 0;
  const totalAmount = unitPrice * qty;

  const handleNextStep = () => {
    if (step === 1 && !selectedMember) {
      toast.error("Избор на клиент", { description: "Моля, изберете член от списъка или Външен клиент, за да продължите." });
      return;
    }

    if (step === 2) {
      const qtyVal = parseInt(quantity, 10);
      const priceVal = parseFloat(price);
      if (isNaN(qtyVal) || qtyVal <= 0) {
        toast.error("Невалидно количество", { description: "Моля, въведете валидно положително количество." });
        return;
      }
      if (isNaN(priceVal) || priceVal < 0) {
        toast.error("Невалидна цена", { description: "Моля, въведете валидна цена." });
        return;
      }
    }

    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleExecuteSale = async () => {
    if (!selectedMember) return;
    setIsProcessing(true);
    setStep(4);

    try {
      const saleData: Omit<Sale, "id"> = {
        siteId: service.siteId || activeBranch || "bkgalabovo",
        memberId: selectedMember.id,
        saleDate: new Date().toISOString(),
        items: [
          {
            productId: service.id,
            name: service.name,
            quantity: qty,
            price: unitPrice,
          },
        ],
        status: "completed",
        isPaid: isPaid,
        totalAmount: totalAmount,
        currency: "EUR",
        paymentMethod: paymentMethod,
        note: note || "",
        type: "general_service",
      };

      const clientName =
        selectedMember.id === "GUEST_EXTERNAL"
          ? "Външен клиент"
          : `${selectedMember.firstName} ${selectedMember.lastName}`;

      const result = await executeGeneralServiceSaleAction(saleData, service.name, clientName);

      if (result.success && result.saleId) {
        setCompletedSaleId(result.saleId);
        setStep(5);
        if (selectedMember.id !== "GUEST_EXTERNAL") {
          mutate(selectedMember.id);
        }
        toast.success("Готово!", { description: "Продажбата бе регистрирана успешно." });
      } else {
        setStep(3);
        toast.error("Грешка", { description: result.error });
      }
    } catch (error: unknown) {
      setStep(3);
      const message = error instanceof Error ? error.message : "Неизвестна грешка";
      toast.error("Грешка при продажба", { description: message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (completedSaleId) {
      onSaleSuccess();
    } else {
      onClose();
    }
  };

  const contextValue: GeneralWizardContextType = {
    step,
    setStep,
    isProcessing,
    completedSaleId,
    service,
    handleClose,
    handlePrevStep,
    handleNextStep,
    handleExecuteSale,
    members,
    setMembers,
    membersLoading,
    searchTerm,
    setSearchTerm,
    selectedMember,
    setSelectedMember,
    clientTypeTab,
    setClientTypeTab,
    showNewGuestForm,
    setShowNewGuestForm,
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
    filteredMembers,
    quantity,
    setQuantity,
    price,
    setPrice,
    paymentMethod,
    setPaymentMethod,
    isPaid,
    setIsPaid,
    note,
    setNote,
    unitPrice,
    qty,
    totalAmount,
  };

  return <GeneralWizardContext.Provider value={contextValue}>{children}</GeneralWizardContext.Provider>;
};

export const useGeneralWizard = () => {
  const context = useContext(GeneralWizardContext);
  if (!context) {
    throw new Error("useGeneralWizard must be used within a GeneralWizardProvider");
  }
  return context;
};
