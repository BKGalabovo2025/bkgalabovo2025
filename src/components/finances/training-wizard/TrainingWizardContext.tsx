"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { mutate } from "swr";
import { toast } from "sonner";
import { format, getYear } from "date-fns";
import { bg } from "date-fns/locale";

import { Service } from "@/app/(protected)/finances/services/service.types";
import { Member, ScheduleEvent, Attendee } from "@/types";
import { getAllMembers } from "@/services/member-service";
import { getEventsByMemberId } from "@/services/schedule-service";
import { executeTrainingSaleAction } from "@/lib/actions/services";
import { useAuth } from "@/context/auth-context";
import { useAppStore } from "@/store/use-app-store";

type PaymentMode = "subscription" | "individual";

interface MemberAttendanceStats {
  memberId: string;
  firstName: string;
  paidCount: number;
  unpaidCount: number;
}

export interface MonthAttendance {
  monthKey: string;
  monthLabel: string;
  year: number;
  events: ScheduleEvent[];
  unpaidCount: number;
  paidCount: number;
  memberStats: Record<string, MemberAttendanceStats>;
}

interface TrainingWizardContextType {
  // Props
  service: Service;
  isOpen: boolean;
  onClose: () => void;
  onSaleSuccess: () => void;

  // Step state
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  totalSteps: number;
  displayStep: number;
  handleNextStep: () => void;
  handlePrevStep: () => void;
  handleClose: () => void;

  // Client Selection State
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  membersLoading: boolean;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  selectedMember: Member | null;
  setSelectedMember: React.Dispatch<React.SetStateAction<Member | null>>;
  isGuestSale: boolean;
  setIsGuestSale: React.Dispatch<React.SetStateAction<boolean>>;
  clientTypeTab: "member" | "guest";
  setClientTypeTab: React.Dispatch<React.SetStateAction<"member" | "guest">>;
  
  // Quick guest form state
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
  clientDisplayName: string;
  familyMembers: (Member | null)[];

  // Attendance State
  attendanceLoading: boolean;
  memberEvents: ScheduleEvent[];
  monthlyAttendance: MonthAttendance[];
  unpaidMonths: MonthAttendance[];
  unpaidEvents: ScheduleEvent[];
  allUnpaidMonthsSelected: boolean;

  // Billing & Payment State
  paymentMode: PaymentMode;
  setPaymentMode: React.Dispatch<React.SetStateAction<PaymentMode>>;
  selectedMonthKeys: string[];
  setSelectedMonthKeys: React.Dispatch<React.SetStateAction<string[]>>;
  selectedEventIds: string[];
  setSelectedEventIds: React.Dispatch<React.SetStateAction<string[]>>;
  
  price: string;
  setPrice: React.Dispatch<React.SetStateAction<string>>;
  paymentMethod: string;
  setPaymentMethod: React.Dispatch<React.SetStateAction<string>>;
  isPaid: boolean;
  setIsPaid: React.Dispatch<React.SetStateAction<boolean>>;
  note: string;
  setNote: React.Dispatch<React.SetStateAction<string>>;
  
  totalAmount: number;
  selectedMonthLabels: string[];

  // Actions
  toggleEventSelection: (eventId: string) => void;
  toggleMonthSelection: (monthKey: string) => void;
  handleExecuteSale: () => Promise<void>;
  
  isProcessing: boolean;
  completedSaleId: string | null;
}

const TrainingWizardContext = createContext<TrainingWizardContextType | undefined>(undefined);

export const useTrainingWizard = () => {
  const context = useContext(TrainingWizardContext);
  if (!context) {
    throw new Error("useTrainingWizard must be used within TrainingWizardProvider");
  }
  return context;
};

interface ProviderProps {
  service: Service;
  isOpen: boolean;
  onClose: () => void;
  onSaleSuccess: () => void;
  children: React.ReactNode;
}

export const TrainingWizardProvider: React.FC<ProviderProps> = ({
  service,
  isOpen,
  onClose,
  onSaleSuccess,
  children,
}) => {
  const [step, setStep] = useState(1);
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isGuestSale, setIsGuestSale] = useState(false);

  const [clientTypeTab, setClientTypeTab] = useState<"member" | "guest">("member");
  const [showNewGuestForm, setShowNewGuestForm] = useState(false);
  const [newGuestFirstName, setNewGuestFirstName] = useState("");
  const [newGuestLastName, setNewGuestLastName] = useState("");
  const [newGuestPhone, setNewGuestPhone] = useState("");
  const [newGuestEmail, setNewGuestEmail] = useState("");
  const [isSavingNewGuest, setIsSavingNewGuest] = useState(false);

  // Attendance state
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [memberEvents, setMemberEvents] = useState<ScheduleEvent[]>([]);

  // Billing config
  const isSubscriptionService = service.type === "Абонамент" || service.type === "Годишен абонамент";
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("subscription");
  const [selectedMonthKeys, setSelectedMonthKeys] = useState<string[]>([]);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);

  // Payment details
  const [price, setPrice] = useState(service.price.toString());
  const [paymentMethod, setPaymentMethod] = useState("В брой");
  const [isPaid, setIsPaid] = useState(true);
  const [note, setNote] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);
  const [completedSaleId, setCompletedSaleId] = useState<string | null>(null);

  const { idToken } = useAuth();
  const { activeBranch } = useAppStore();

  // Load members
  useEffect(() => {
    if (isOpen) {
      const fetchMembers = async () => {
        setMembersLoading(true);
        try {
          const fetchedMembers = await getAllMembers();
          setMembers(fetchedMembers);
        } catch (err) {
          console.error("Error loading members:", err);
          toast.error("Грешка", {
            description: "Неуспешно зареждане на клубните членове.",
          });
        } finally {
          setMembersLoading(false);
        }
      };
      fetchMembers();

      // Reset state on open
      setStep(1);
      setPrice(service.price.toString());
      setSelectedMember(null);
      setIsGuestSale(false);
      setCompletedSaleId(null);
      setNote("");
      setSelectedMonthKeys([]);
      setSelectedEventIds([]);
      setMemberEvents([]);
      setPaymentMode(isSubscriptionService ? "subscription" : "individual");
      setSearchTerm("");
      setClientTypeTab("member");
      setShowNewGuestForm(false);
      setNewGuestFirstName("");
      setNewGuestLastName("");
      setNewGuestPhone("");
      setNewGuestEmail("");
      setIsSavingNewGuest(false);
    }
  }, [isOpen, service, isSubscriptionService]);

  const isFamilySubscription = useMemo(() => {
    return isSubscriptionService && service.name.toLowerCase().includes("семеен");
  }, [isSubscriptionService, service.name]);

  const familyMembers = useMemo(() => {
    if (!selectedMember || !isFamilySubscription) return [selectedMember];
    if (selectedMember.familyId) {
      return members.filter((m) => m.familyId === selectedMember.familyId);
    }
    return [selectedMember];
  }, [selectedMember, isFamilySubscription, members]);

  const targetMemberIds = useMemo(() => {
    return familyMembers.map((m) => m?.id).filter(Boolean) as string[];
  }, [familyMembers]);

  const clientDisplayName = useMemo(() => {
    if (isGuestSale) return "Външен клиент";
    if (isFamilySubscription && familyMembers.length > 0) {
      return familyMembers.map((m) => `${m?.firstName} ${m?.lastName}`).join(", ");
    }
    return `${selectedMember?.firstName} ${selectedMember?.lastName}`;
  }, [isGuestSale, isFamilySubscription, familyMembers, selectedMember]);

  // Load attendance
  useEffect(() => {
    if (selectedMember && !isGuestSale && step === 2) {
      const fetchAttendance = async () => {
        setAttendanceLoading(true);
        try {
          const fetchPromises = targetMemberIds.map((id) => getEventsByMemberId(id));
          const results = await Promise.all(fetchPromises);
          const events = results.flat();

          // Filter to attended-only events for this training type
          const attended = events.filter((e) => {
            const rec = e.attendees?.find((a: Attendee) => targetMemberIds.includes(a.memberId));
            return rec?.attended === true;
          });

          // Deduplicate events by id
          const uniqueEventsMap = new Map();
          attended.forEach((e) => uniqueEventsMap.set(e.id, e));
          setMemberEvents(Array.from(uniqueEventsMap.values()));
        } catch (err) {
          console.error("Error loading member attendance:", err);
          toast.error("Грешка", {
            description: "Неуспешно зареждане на присъствията.",
          });
        } finally {
          setAttendanceLoading(false);
        }
      };
      fetchAttendance();
    }
  }, [selectedMember, isGuestSale, step, targetMemberIds]);

  const monthlyAttendance = useMemo((): MonthAttendance[] => {
    const groupedMap = new Map<string, MonthAttendance>();

    for (const event of memberEvents) {
      const d = new Date(event.startDate);
      const monthKey = format(d, "yyyy-MM");
      const monthLabel =
        format(d, "LLLL", { locale: bg }).charAt(0).toUpperCase() +
        format(d, "LLLL", { locale: bg }).slice(1) +
        " " +
        getYear(d);

      const targetAttendees = event.attendees?.filter((a: Attendee) =>
        targetMemberIds.includes(a.memberId)
      ) || [];

      if (!groupedMap.has(monthKey)) {
        groupedMap.set(monthKey, {
          monthKey,
          monthLabel,
          year: getYear(d),
          events: [],
          unpaidCount: 0,
          paidCount: 0,
          memberStats: {},
        });
      }

      const entry = groupedMap.get(monthKey)!;
      entry.events.push(event);

      for (const att of targetAttendees) {
        if (!entry.memberStats[att.memberId]) {
          const familyMember = familyMembers.find((m) => m?.id === att.memberId);
          entry.memberStats[att.memberId] = {
            memberId: att.memberId,
            firstName: familyMember?.firstName || "Неизвестен",
            paidCount: 0,
            unpaidCount: 0,
          };
        }

        if (att.paymentStatus === "paid") {
          entry.paidCount++;
          entry.memberStats[att.memberId].paidCount++;
        } else {
          entry.unpaidCount++;
          entry.memberStats[att.memberId].unpaidCount++;
        }
      }
    }

    return Array.from(groupedMap.values()).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [memberEvents, targetMemberIds, familyMembers]);

  const unpaidEvents = useMemo(() => {
    return memberEvents
      .filter((e) => {
        const hasUnpaidTarget = e.attendees?.some(
          (a: Attendee) => targetMemberIds.includes(a.memberId) && (!a.paymentStatus || a.paymentStatus === "unpaid")
        );
        return hasUnpaidTarget;
      })
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [memberEvents, targetMemberIds]);

  const filteredMembers = members.filter((m) => {
    const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const handleNextStep = () => {
    if (step === 1) {
      if (!selectedMember && !isGuestSale) {
        toast.error("Избор на клиент", {
          description: "Моля, изберете член от списъка или продажба на Външен клиент.",
        });
        return;
      }
    }

    if (step === 2 && !isGuestSale) {
      if (paymentMode === "subscription" && selectedMonthKeys.length === 0) {
        toast.error("Избор на месец", {
          description: "Моля, изберете поне един месец за плащане.",
        });
        return;
      }
      if (paymentMode === "individual" && selectedEventIds.length === 0) {
        toast.error("Избор на тренировки", {
          description: "Моля, изберете поне една тренировка за плащане.",
        });
        return;
      }
    }

    if (step === 3) {
      const priceVal = parseFloat(price);
      if (isNaN(priceVal) || priceVal < 0) {
        toast.error("Невалидна цена", {
          description: "Моля, въведете валидна цена.",
        });
        return;
      }
    }

    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setStep((prev) => prev - 1);
  };

  const toggleEventSelection = (eventId: string) => {
    setSelectedEventIds((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  const toggleMonthSelection = (monthKey: string) => {
    setSelectedMonthKeys((prev) =>
      prev.includes(monthKey) ? prev.filter((k) => k !== monthKey) : [...prev, monthKey]
    );
  };

  const unpaidMonths = useMemo(() => monthlyAttendance.filter((m) => m.unpaidCount > 0), [monthlyAttendance]);

  const allUnpaidMonthsSelected =
    unpaidMonths.length > 0 && unpaidMonths.every((m) => selectedMonthKeys.includes(m.monthKey));

  const totalAmount = useMemo(() => {
    const base = parseFloat(price) || 0;
    if (isGuestSale) return base;
    if (paymentMode === "subscription") {
      const months = selectedMonthKeys.length || 1;
      return base * months;
    }
    if (paymentMode === "individual") {
      const eventsCount = selectedEventIds.length || 1;
      return base * eventsCount;
    }
    return base;
  }, [price, isGuestSale, paymentMode, selectedMonthKeys, selectedEventIds]);

  const getPaidEventIds = () => {
    if (isGuestSale || paymentMode !== "subscription") return [];

    return monthlyAttendance
      .filter((m) => selectedMonthKeys.includes(m.monthKey))
      .flatMap((m) =>
        m.events
          .filter((e) => {
            return e.attendees?.some(
              (a: Attendee) => targetMemberIds.includes(a.memberId) && (!a.paymentStatus || a.paymentStatus === "unpaid")
            );
          })
          .map((e) => e.id)
      );
  };

  const getSaleQuantity = () => {
    if (isGuestSale) return 1;
    if (paymentMode === "subscription") return selectedMonthKeys.length || 1;
    return selectedEventIds.length || 1;
  };

  const getTargetEventDates = () => {
    if (isGuestSale || paymentMode !== "individual") return null;
    return selectedEventIds
      .map((id) => {
        const ev = memberEvents.find((e) => e.id === id);
        return ev ? new Date(ev.startDate).toLocaleDateString("bg-BG") : null;
      })
      .filter(Boolean);
  };

  const getPaidEventIdsForSale = () => {
    if (isGuestSale) return [];
    if (paymentMode === "individual") return selectedEventIds;
    return getPaidEventIds();
  };

  const handleExecuteSale = async () => {
    if (!idToken) return;
    setIsProcessing(true);
    setStep(5);

    const customPrice = parseFloat(price);
    const qty = getSaleQuantity();

    try {
      const clientName = isGuestSale
        ? "Външен клиент"
        : familyMembers.map((m) => `${m!.firstName} ${m!.lastName}`).join(", ");

      const selectedLabels = monthlyAttendance
        .filter((m) => selectedMonthKeys.includes(m.monthKey))
        .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
        .map((m) => m.monthLabel);

      const targetEventDates = getTargetEventDates();

      const baseSaleData: Record<string, unknown> = {
        siteId: activeBranch || "bkgalabovo",
        memberId: isGuestSale ? "GUEST_EXTERNAL" : selectedMember!.id,
        clientName: clientName,
        saleDate: new Date().toISOString(),
        items: [
          {
            productId: service.id,
            name: service.name,
            quantity: qty,
            price: customPrice,
          },
        ],
        status: "completed",
        isPaid: isPaid,
        totalAmount: totalAmount,
        currency: "EUR",
        paymentMethod: paymentMethod,
        note: note || "",
        type: "training_service",
        targetEventDates: targetEventDates,
        paidEventIds: getPaidEventIdsForSale(),
      };

      if (!isGuestSale) {
        baseSaleData.paymentMode = paymentMode;
        baseSaleData.targetMonths = selectedMonthKeys;
        baseSaleData.targetMonthLabels = selectedLabels;
        baseSaleData.memberIdForAttendance = selectedMember?.id;
        baseSaleData.memberIdsForAttendance = targetMemberIds;
      } else {
        baseSaleData.paymentMode = null;
        baseSaleData.targetMonths = null;
        baseSaleData.targetMonthLabels = null;
        baseSaleData.memberIdForAttendance = null;
        baseSaleData.memberIdsForAttendance = null;
      }

      const saleData = baseSaleData;

      const result = await executeTrainingSaleAction(idToken, saleData, service.name, clientName);

      if (result.success && result.saleId) {
        setCompletedSaleId(result.saleId);
        setStep(6);
        if (!isGuestSale && selectedMember) {
          mutate(selectedMember.id);
          mutate(`events_${selectedMember.id}`);
        }
        toast.success("Готово!", {
          description: "Продажбата бе регистрирана успешно.",
        });
      } else {
        setStep(4);
        toast.error("Грешка", {
          description: result.error || "Грешка при продажба",
        });
      }
    } catch (error: unknown) {
      setStep(4);
      const message = error instanceof Error ? error.message : "Неизвестна грешка";
      toast.error("Грешка при продажба", {
        description: message,
      });
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

  const selectedMonthLabels = monthlyAttendance
    .filter((m) => selectedMonthKeys.includes(m.monthKey))
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    .map((m) => m.monthLabel);

  const steps = isGuestSale ? ["Клиент", "Плащане", "Преглед"] : ["Клиент", "Присъствия", "Плащане", "Преглед"];
  const totalSteps = steps.length;
  const displayStep = Math.min(step, totalSteps);

  const contextValue: TrainingWizardContextType = {
    service,
    isOpen,
    onClose,
    onSaleSuccess,
    step,
    setStep,
    totalSteps,
    displayStep,
    handleNextStep,
    handlePrevStep,
    handleClose,
    members,
    setMembers,
    membersLoading,
    searchTerm,
    setSearchTerm,
    selectedMember,
    setSelectedMember,
    isGuestSale,
    setIsGuestSale,
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
    clientDisplayName,
    familyMembers,
    attendanceLoading,
    memberEvents,
    monthlyAttendance,
    unpaidMonths,
    unpaidEvents,
    allUnpaidMonthsSelected,
    paymentMode,
    setPaymentMode,
    selectedMonthKeys,
    setSelectedMonthKeys,
    selectedEventIds,
    setSelectedEventIds,
    price,
    setPrice,
    paymentMethod,
    setPaymentMethod,
    isPaid,
    setIsPaid,
    note,
    setNote,
    totalAmount,
    selectedMonthLabels,
    toggleEventSelection,
    toggleMonthSelection,
    handleExecuteSale,
    isProcessing,
    completedSaleId,
  };

  return <TrainingWizardContext.Provider value={contextValue}>{children}</TrainingWizardContext.Provider>;
};
