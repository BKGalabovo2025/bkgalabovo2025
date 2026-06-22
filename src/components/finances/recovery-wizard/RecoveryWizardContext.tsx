"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { mutate } from "swr";
import { toast } from "sonner";
import { ClubService as Service, Member, ScheduleEvent, Attendee } from "@/types";
import { getAllMembers } from "@/services/member-service";
import { getEventsByMemberId } from "@/services/schedule-service";
import { executeTrainingSaleAction } from "@/lib/actions/services";
import { useAuth } from "@/context/auth-context";
import { useAppStore } from "@/store/use-app-store";
import { format, getYear } from "date-fns";
import { bg } from "date-fns/locale";

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

interface RecoveryWizardContextType {
  // Wizard state
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  totalSteps: number;
  displayStep: number;
  isProcessing: boolean;
  completedSaleId: string | null;

  // External deps
  service: Service;
  handleClose: () => void;
  handlePrevStep: () => void;
  handleNextStep: () => void;
  handleExecuteSale: () => Promise<void>;

  // Step 1: Client selection
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

  // Step 2: Attendance selection
  attendanceLoading: boolean;
  memberEvents: ScheduleEvent[];
  paymentMode: PaymentMode;
  setPaymentMode: React.Dispatch<React.SetStateAction<PaymentMode>>;
  monthlyAttendance: MonthAttendance[];
  unpaidMonths: MonthAttendance[];
  selectedMonthKeys: string[];
  setSelectedMonthKeys: React.Dispatch<React.SetStateAction<string[]>>;
  allUnpaidMonthsSelected: boolean;
  toggleMonthSelection: (monthKey: string) => void;
  unpaidEvents: ScheduleEvent[];
  selectedEventIds: string[];
  setSelectedEventIds: React.Dispatch<React.SetStateAction<string[]>>;
  toggleEventSelection: (eventId: string) => void;
  selectedMonthLabels: string[];

  // Step 3: Payment details
  price: string;
  setPrice: React.Dispatch<React.SetStateAction<string>>;
  paymentMethod: string;
  setPaymentMethod: React.Dispatch<React.SetStateAction<string>>;
  isPaid: boolean;
  setIsPaid: React.Dispatch<React.SetStateAction<boolean>>;
  note: string;
  setNote: React.Dispatch<React.SetStateAction<string>>;
  totalAmount: number;
}

const RecoveryWizardContext = createContext<RecoveryWizardContextType | undefined>(undefined);

interface RecoveryWizardProviderProps {
  children: ReactNode;
  service: Service;
  isOpen: boolean;
  onClose: () => void;
  onSaleSuccess: () => void;
}

// ── Pure helper functions (reduces handleExecuteSale complexity) ───────────────

function getSaleQuantity(isGuestSale: boolean, paymentMode: string, selectedMonthKeys: string[], selectedEventIds: string[]): number {
  if (isGuestSale) return 1;
  if (paymentMode === "subscription") return selectedMonthKeys.length || 1;
  return selectedEventIds.length || 1;
}

function getPaidEventIdsForSale(isGuestSale: boolean, paymentMode: string, selectedEventIds: string[], getPaidEventIdsFn: () => string[]): string[] {
  if (isGuestSale) return [];
  if (paymentMode === "individual") return selectedEventIds;
  return getPaidEventIdsFn();
}

function getTargetEventDates(isGuestSale: boolean, paymentMode: string, selectedEventIds: string[], memberEvents: ScheduleEvent[]): (string | null)[] | null {
  if (isGuestSale || paymentMode !== "individual") return null;
  return selectedEventIds
    .map((id) => {
      const ev = memberEvents.find((e) => e.id === id);
      return ev ? new Date(ev.startDate).toLocaleDateString("bg-BG") : null;
    })
    .filter(Boolean);
}

function getClientName(isGuestSale: boolean, familyMembers: Member[]): string {
  if (isGuestSale) return "Външен клиент";
  return familyMembers.map((m) => `${m.firstName} ${m.lastName}`).join(", ");
}

function getSelectedMonthLabelsArr(monthlyAttendance: MonthAttendance[], selectedMonthKeys: string[]): string[] {
  return monthlyAttendance
    .filter((m) => selectedMonthKeys.includes(m.monthKey))
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    .map((m) => m.monthLabel);
}

function getSaleDataPayload(args: {
  isGuestSale: boolean;
  selectedMember: Member | null;
  clientName: string;
  activeBranch: string | null;
  service: Service;
  qty: number;
  customPrice: number;
  isPaid: boolean;
  totalAmount: number;
  paymentMethod: string;
  note: string;
  paymentMode: string;
  selectedMonthKeys: string[];
  selectedMonthLabelsArr: string[];
  targetEventDates: (string | null)[] | null;
  paidEventIdsForSale: string[];
  targetMemberIds: string[];
}) {
  return {
    siteId: args.activeBranch || "bkgalabovo",
    memberId: args.isGuestSale ? "GUEST_EXTERNAL" : args.selectedMember!.id,
    clientName: args.clientName,
    saleDate: new Date().toISOString(),
    items: [
      {
        productId: args.service.id,
        name: args.service.name,
        quantity: args.qty,
        price: args.customPrice,
      },
    ],
    status: "completed",
    isPaid: args.isPaid,
    totalAmount: args.totalAmount,
    currency: "EUR",
    paymentMethod: args.paymentMethod,
    note: args.note || "",
    type: "recovery_service",
    paymentMode: args.isGuestSale ? null : args.paymentMode,
    targetMonths: args.isGuestSale ? null : args.selectedMonthKeys,
    targetMonthLabels: args.isGuestSale ? null : args.selectedMonthLabelsArr,
    targetEventDates: args.targetEventDates,
    paidEventIds: args.paidEventIdsForSale,
    memberIdForAttendance: args.isGuestSale ? null : args.selectedMember?.id,
    memberIdsForAttendance: args.isGuestSale ? null : args.targetMemberIds,
  };
}

export const RecoveryWizardProvider = ({
  children,
  service,
  isOpen,
  onClose,
  onSaleSuccess,
}: RecoveryWizardProviderProps) => {
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
  const isSubscriptionService = service.type === "Абонамент";
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(
    isSubscriptionService ? "subscription" : "individual"
  );
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

  // Reset state and load members on open
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

  const familyMembers = useMemo((): Member[] => {
    if (!selectedMember || !isFamilySubscription) return selectedMember ? [selectedMember] : [];
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

          const attended = events.filter((e) => {
            const rec = e.attendees?.find((a: Attendee) => targetMemberIds.includes(a.memberId));
            return rec?.attended === true;
          });

          const uniqueEventsMap = new Map();
          attended.forEach((e) => uniqueEventsMap.set(e.id, e));
          setMemberEvents(Array.from(uniqueEventsMap.values()));
        } catch (err) {
          console.error("Error loading member attendance:", err);
          toast.error("Грешка", { description: "Неуспешно зареждане на присъствията." });
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
          const fm = familyMembers.find((m) => m?.id === att.memberId);
          entry.memberStats[att.memberId] = {
            memberId: att.memberId,
            firstName: fm?.firstName || "Неизвестен",
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
        return e.attendees?.some(
          (a: Attendee) =>
            targetMemberIds.includes(a.memberId) && (!a.paymentStatus || a.paymentStatus === "unpaid")
        );
      })
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [memberEvents, targetMemberIds]);

  const filteredMembers = members.filter((m) => {
    const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const unpaidMonths = useMemo(() => monthlyAttendance.filter((m) => m.unpaidCount > 0), [
    monthlyAttendance,
  ]);

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

  const handleNextStep = () => {
    if (step === 1) {
      if (!selectedMember && !isGuestSale) {
        toast.error("Избор на клиент", { description: "Моля, изберете член от списъка или продажба на Външен клиент." });
        return;
      }
    }

    if (step === 2 && !isGuestSale) {
      if (paymentMode === "subscription" && selectedMonthKeys.length === 0) {
        toast.error("Избор на месец", { description: "Моля, изберете поне един месец за плащане." });
        return;
      }
      if (paymentMode === "individual" && selectedEventIds.length === 0) {
        toast.error("Избор на тренировки", { description: "Моля, изберете поне една процедура за плащане." });
        return;
      }
    }

    if (step === 3) {
      const priceVal = parseFloat(price);
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

  const handleClose = () => {
    if (completedSaleId) {
      onSaleSuccess();
    } else {
      onClose();
    }
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

  const getPaidEventIds = () => {
    if (isGuestSale || paymentMode !== "subscription") return [];

    return monthlyAttendance
      .filter((m) => selectedMonthKeys.includes(m.monthKey))
      .flatMap((m) =>
        m.events
          .filter((e) => {
            return e.attendees?.some(
              (a: Attendee) =>
                targetMemberIds.includes(a.memberId) && (!a.paymentStatus || a.paymentStatus === "unpaid")
            );
          })
          .map((e) => e.id)
      );
  };

  const handleExecuteSale = async () => {
    if (!idToken) return;
    setIsProcessing(true);
    setStep(5);

    const customPrice = parseFloat(price);
    const qty = getSaleQuantity(isGuestSale, paymentMode, selectedMonthKeys, selectedEventIds);

    try {
      const clientName = getClientName(isGuestSale, familyMembers);
      const selectedMonthLabelsArr = getSelectedMonthLabelsArr(monthlyAttendance, selectedMonthKeys);
      const targetEventDates = getTargetEventDates(isGuestSale, paymentMode, selectedEventIds, memberEvents);
      const paidEventIdsForSale = getPaidEventIdsForSale(isGuestSale, paymentMode, selectedEventIds, getPaidEventIds);

      const saleData = getSaleDataPayload({
        isGuestSale,
        selectedMember,
        clientName,
        activeBranch,
        service,
        qty,
        customPrice,
        isPaid,
        totalAmount,
        paymentMethod,
        note,
        paymentMode,
        selectedMonthKeys,
        selectedMonthLabelsArr,
        targetEventDates,
        paidEventIdsForSale,
        targetMemberIds,
      });

      const result = await executeTrainingSaleAction(idToken, saleData, service.name, clientName);

      if (result.success && result.saleId) {
        setCompletedSaleId(result.saleId);
        setStep(6);
        if (!isGuestSale && selectedMember) {
          mutate(selectedMember.id);
          mutate(`events_${selectedMember.id}`);
        }
        toast.success("Готово!", { description: "Продажбата бе регистрирана успешно." });
      } else {
        setStep(4);
        toast.error("Грешка", { description: result.error || "Грешка при продажба" });
      }
    } catch (error) {
      setStep(4);
      toast.error("Грешка при продажба", { description: error instanceof Error ? error.message : "Възникна системна грешка" });
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedMonthLabels = monthlyAttendance
    .filter((m) => selectedMonthKeys.includes(m.monthKey))
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    .map((m) => m.monthLabel);

  const steps = isGuestSale
    ? ["Клиент", "Плащане", "Преглед"]
    : ["Клиент", "Присъствия", "Плащане", "Преглед"];
  const totalSteps = steps.length;
  const displayStep = Math.min(step, totalSteps);

  const contextValue: RecoveryWizardContextType = {
    step,
    setStep,
    totalSteps,
    displayStep,
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
    attendanceLoading,
    memberEvents,
    paymentMode,
    setPaymentMode,
    monthlyAttendance,
    unpaidMonths,
    selectedMonthKeys,
    setSelectedMonthKeys,
    allUnpaidMonthsSelected,
    toggleMonthSelection,
    unpaidEvents,
    selectedEventIds,
    setSelectedEventIds,
    toggleEventSelection,
    selectedMonthLabels,
    price,
    setPrice,
    paymentMethod,
    setPaymentMethod,
    isPaid,
    setIsPaid,
    note,
    setNote,
    totalAmount,
  };

  return <RecoveryWizardContext.Provider value={contextValue}>{children}</RecoveryWizardContext.Provider>;
};

export const useRecoveryWizard = () => {
  const context = useContext(RecoveryWizardContext);
  if (!context) {
    throw new Error("useRecoveryWizard must be used within a RecoveryWizardProvider");
  }
  return context;
};
