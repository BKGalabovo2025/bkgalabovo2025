"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { mutate } from "swr";
import { toast } from "sonner";
import { Product, Member } from "@/types";
import { getAllMembers } from "@/services/member-service";
import { createMemberAction } from "@/lib/actions/members";
import { createSaleAction } from "@/lib/actions/sales";
import { useAuth } from "@/context/auth-context";
import { useAppStore } from "@/store/use-app-store";

interface ProductSaleWizardContextType {
  product: Product;
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  
  // Buyer selection
  members: Member[];
  membersLoading: boolean;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  selectedMember: Member | null;
  setSelectedMember: React.Dispatch<React.SetStateAction<Member | null>>;
  clientTypeTab: "member" | "guest";
  setClientTypeTab: React.Dispatch<React.SetStateAction<"member" | "guest">>;
  
  // New Guest Form
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
  handleCreateGuest: () => Promise<void>;

  // Form states
  quantity: string;
  setQuantity: React.Dispatch<React.SetStateAction<string>>;
  paymentMethod: string;
  setPaymentMethod: React.Dispatch<React.SetStateAction<string>>;
  isPaid: boolean;
  setIsPaid: React.Dispatch<React.SetStateAction<boolean>>;
  note: string;
  setNote: React.Dispatch<React.SetStateAction<string>>;
  
  // Processing & Success
  isProcessing: boolean;
  completedSaleId: string | null;

  // Actions
  handleNextStep: () => void;
  handlePrevStep: () => void;
  handleExecuteSale: () => Promise<void>;
  handleClose: () => void;

  filteredMembers: Member[];
  totalAmount: number;
}

const ProductSaleWizardContext = createContext<ProductSaleWizardContextType | undefined>(undefined);

interface ProductSaleWizardProviderProps {
  children: ReactNode;
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onSaleSuccess: () => void;
}

export const ProductSaleWizardProvider = ({
  children,
  product,
  isOpen,
  onClose,
  onSaleSuccess,
}: ProductSaleWizardProviderProps) => {
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

  const [quantity, setQuantity] = useState("1");
  const [paymentMethod, setPaymentMethod] = useState("В брой");
  const [isPaid, setIsPaid] = useState(true);
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedSaleId, setCompletedSaleId] = useState<string | null>(null);

  const { idToken } = useAuth();
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
  }, [isOpen]);

  const filteredMembers = members.filter((m) => {
    const isGuest = m.isGuest || m.memberType === "guest";
    const matchesTab = clientTypeTab === "guest" ? isGuest : !isGuest;
    if (!matchesTab) return false;

    const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const handleNextStep = useCallback(() => {
    if (step === 1 && !selectedMember) {
      toast.error("Избор на купувач", { description: "Моля, изберете член от списъка, за да продължите." });
      return;
    }

    if (step === 2) {
      const qtyVal = parseInt(quantity, 10);
      if (isNaN(qtyVal) || qtyVal <= 0) {
        toast.error("Невалидно количество", { description: "Моля, въведете валидно положително количество." });
        return;
      }
      if (qtyVal > product.stock) {
        toast.error("Недостатъчна наличност", { description: `Имате само ${product.stock} бр. от този артикул на склад.` });
        return;
      }
    }

    setStep((prev) => prev + 1);
  }, [step, selectedMember, quantity, product.stock]);

  const handlePrevStep = useCallback(() => {
    setStep((prev) => prev - 1);
  }, []);

  const handleCreateGuest = async () => {
    if (!newGuestFirstName || !newGuestLastName || !newGuestPhone) {
      toast.error("Непълни данни", { description: "Моля, попълнете Име, Фамилия и Телефон на госта." });
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
        } as Member;

        setMembers((prev) => [newGuestObj, ...prev]);
        setSelectedMember(newGuestObj);

        toast.success("Успех!", { description: "Външният клиент беше регистриран и избран успешно." });

        setShowNewGuestForm(false);
        setNewGuestFirstName("");
        setNewGuestLastName("");
        setNewGuestPhone("");
        setNewGuestEmail("");
        setStep(2);
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

  const handleExecuteSale = async () => {
    if (!selectedMember || !idToken) return;
    setIsProcessing(true);
    setStep(4);

    const qty = parseInt(quantity, 10);
    const calculatedTotalAmount = product.price * qty;

    try {
      const saleData = {
        siteId: product.siteId || activeBranch || "bkgalabovo",
        memberId: selectedMember.id,
        saleDate: new Date().toISOString(),
        items: [
          {
            productId: product.id,
            name: product.name,
            quantity: qty,
            price: product.price,
          },
        ],
        status: "completed",
        isPaid: isPaid,
        totalAmount: calculatedTotalAmount,
        currency: "EUR",
        paymentMethod: paymentMethod,
        note: note || "",
        clientName:
          selectedMember.id === "GUEST_EXTERNAL"
            ? "Външен клиент"
            : `${selectedMember.firstName} ${selectedMember.lastName}`,
      };

      const result = await createSaleAction(idToken, saleData);

      if (result.success && result.data) {
        const saleId = (result.data as { id: string }).id;
        setCompletedSaleId(saleId);
        setStep(5);
        if (selectedMember.id !== "GUEST_EXTERNAL") {
          mutate(selectedMember.id);
        }
        toast.success("Готово!", { description: "Продажбата бе регистрирана успешно." });
      } else {
        setStep(3);
        toast.error("Грешка", { description: result.message });
      }
    } catch (error) {
      setStep(3);
      toast.error("Грешка при продажба", { description: (error as Error).message });
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

  const qty = parseInt(quantity, 10) || 1;
  const totalAmount = product.price * qty;

  const contextValue: ProductSaleWizardContextType = {
    product,
    step, setStep,
    members, membersLoading,
    searchTerm, setSearchTerm,
    selectedMember, setSelectedMember,
    clientTypeTab, setClientTypeTab,
    showNewGuestForm, setShowNewGuestForm,
    newGuestFirstName, setNewGuestFirstName,
    newGuestLastName, setNewGuestLastName,
    newGuestPhone, setNewGuestPhone,
    newGuestEmail, setNewGuestEmail,
    isSavingNewGuest, handleCreateGuest,
    quantity, setQuantity,
    paymentMethod, setPaymentMethod,
    isPaid, setIsPaid,
    note, setNote,
    isProcessing, completedSaleId,
    handleNextStep, handlePrevStep, handleExecuteSale, handleClose,
    filteredMembers, totalAmount
  };

  return <ProductSaleWizardContext.Provider value={contextValue}>{children}</ProductSaleWizardContext.Provider>;
};

export const useProductSaleWizard = () => {
  const context = useContext(ProductSaleWizardContext);
  if (!context) {
    throw new Error("useProductSaleWizard must be used within a ProductSaleWizardProvider");
  }
  return context;
};
