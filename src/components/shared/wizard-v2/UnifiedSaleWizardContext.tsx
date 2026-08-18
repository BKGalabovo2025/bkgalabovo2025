"use client";

import { format, getYear } from "date-fns";
import { bg } from "date-fns/locale";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { mutate } from "swr";

import { useAuth } from "@/context/auth-context";
import { executeGeneralServiceSaleAction } from "@/lib/actions/general-services-server";
import { createSaleAction } from "@/lib/actions/sales";
import { executeTrainingSaleAction } from "@/lib/actions/services";
import { getAllMembers } from "@/services/member-service";
import { getEventsByMemberId } from "@/services/schedule-service";
import { useAppStore } from "@/store/use-app-store";
import { Attendee, Member, ScheduleEvent } from "@/types";

type PaymentMode = "subscription" | "individual";

interface MemberAttendanceStats {
  memberId: string;
  firstName: string;
  paidCount: number;
  unpaidCount: number;
}

interface MonthAttendance {
  monthKey: string;
  monthLabel: string;
  year: number;
  events: ScheduleEvent[];
  unpaidCount: number;
  paidCount: number;
  memberStats: Record<string, MemberAttendanceStats>;
}

interface UnifiedSaleWizardContextType {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any; // Product | Service | GeneralService
  mode: "product" | "general" | "training" | "recovery";

  isOpen: boolean;
  onClose: () => void;
  onSaleSuccess: () => void;

  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  totalSteps: number;
  displayStep: number;

  handleNextStep: () => void;
  handlePrevStep: () => void;
  handleClose: () => void;

  // ── 1. Client Selection ──
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
  familyMembers: (Member | null)[];

  // ── 2. Attendance & Details (Only for Services) ──
  attendanceLoading: boolean;
  memberEvents: ScheduleEvent[];
  monthlyAttendance: MonthAttendance[];
  unpaidMonths: MonthAttendance[];
  unpaidEvents: ScheduleEvent[];
  allUnpaidMonthsSelected: boolean;

  paymentMode: PaymentMode;
  setPaymentMode: React.Dispatch<React.SetStateAction<PaymentMode>>;
  selectedMonthKeys: string[];
  setSelectedMonthKeys: React.Dispatch<React.SetStateAction<string[]>>;
  selectedEventIds: string[];
  setSelectedEventIds: React.Dispatch<React.SetStateAction<string[]>>;

  // ── 3. Payment & Summary ──
  price: string;
  setPrice: React.Dispatch<React.SetStateAction<string>>;
  quantity: string;
  setQuantity: React.Dispatch<React.SetStateAction<string>>;
  paymentMethod: string;
  setPaymentMethod: React.Dispatch<React.SetStateAction<string>>;
  isPaid: boolean;
  setIsPaid: React.Dispatch<React.SetStateAction<boolean>>;
  note: string;
  setNote: React.Dispatch<React.SetStateAction<string>>;
  saleDate: string;
  setSaleDate: React.Dispatch<React.SetStateAction<string>>;
  totalAmount: number;

  selectedMonthLabels: string[];
  toggleEventSelection: (eventId: string) => void;
  toggleMonthSelection: (monthKey: string) => void;

  handleExecuteSale: () => Promise<void>;
  isProcessing: boolean;
  completedSaleId: string | null;
}

const UnifiedSaleWizardContext = createContext<
  UnifiedSaleWizardContextType | undefined
>(undefined);

export const useUnifiedSaleWizard = () => {
  const context = useContext(UnifiedSaleWizardContext);
  if (!context) {
    throw new Error(
      "useUnifiedSaleWizard must be used within UnifiedSaleWizardProvider"
    );
  }
  return context;
};

interface ProviderProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any; // Product | Service | GeneralService
  mode: "product" | "general" | "training" | "recovery";
  isOpen: boolean;
  onClose: () => void;
  onSaleSuccess: () => void;
  children: React.ReactNode;
}

export const UnifiedSaleWizardProvider: React.FC<ProviderProps> = ({
  item,
  mode,
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

  const [clientTypeTab, setClientTypeTab] = useState<"member" | "guest">(
    "member"
  );
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
  const isSubscriptionService =
    mode === "training" &&
    (item.type === "Абонамент" || item.type === "Годишен абонамент");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("subscription");
  const [selectedMonthKeys, setSelectedMonthKeys] = useState<string[]>([]);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);

  // Payment details
  const [price, setPrice] = useState(item.price.toString());
  const [quantity, setQuantity] = useState("1");
  const [paymentMethod, setPaymentMethod] = useState("В брой");
  const [isPaid, setIsPaid] = useState(true);
  const [note, setNote] = useState("");
  const [saleDate, setSaleDate] = useState(new Date().toISOString());

  const [isProcessing, setIsProcessing] = useState(false);
  const [completedSaleId, setCompletedSaleId] = useState<string | null>(null);

  const { idToken } = useAuth();
  const { activeBranch } = useAppStore();

  // When a sale item is set, determine initial mode
  useEffect(() => {
    if (
      item &&
      mode === "training" &&
      !isSubscriptionService &&
      !("isPackage" in item && item.isPackage)
    ) {
      setPaymentMode("individual");
    }
  }, [item, mode, isSubscriptionService]);

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
      setPrice(item.price.toString());
      setQuantity("1");
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
  }, [isOpen, item, isSubscriptionService]);

  const isFamilySubscription = useMemo(() => {
    return (
      isSubscriptionService &&
      (item.name || "").toLowerCase().includes("семеен")
    );
  }, [isSubscriptionService, item.name]);

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
    if (isGuestSale && !selectedMember) return "Външен клиент";
    if (isGuestSale && selectedMember)
      return `${selectedMember.firstName} ${selectedMember.lastName}`;
    if (isFamilySubscription && familyMembers.length > 0) {
      return familyMembers
        .map((m) => `${m?.firstName} ${m?.lastName}`)
        .join(", ");
    }
    return `${selectedMember?.firstName} ${selectedMember?.lastName}`;
  }, [isGuestSale, isFamilySubscription, familyMembers, selectedMember]);

  // Load attendance
  useEffect(() => {
    if (selectedMember && !isGuestSale && step === 2) {
      const fetchAttendance = async () => {
        setAttendanceLoading(true);
        try {
          const fetchPromises = targetMemberIds.map((id) =>
            getEventsByMemberId(id)
          );
          const results = await Promise.all(fetchPromises);
          const events = results.flat();

          // Filter to attended-only events
          const attended = events.filter((e) => {
            const rec = e.attendees?.find((a: Attendee) =>
              targetMemberIds.includes(a.memberId)
            );
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

      const targetAttendees =
        event.attendees?.filter((a: Attendee) =>
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
          const familyMember = familyMembers.find(
            (m) => m?.id === att.memberId
          );
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

    return Array.from(groupedMap.values()).sort((a, b) =>
      b.monthKey.localeCompare(a.monthKey)
    );
  }, [memberEvents, targetMemberIds, familyMembers]);

  const unpaidEvents = useMemo(() => {
    return memberEvents
      .filter((e) => {
        const hasUnpaidTarget = e.attendees?.some(
          (a: Attendee) =>
            targetMemberIds.includes(a.memberId) &&
            (!a.paymentStatus || a.paymentStatus === "unpaid")
        );
        return hasUnpaidTarget;
      })
      .sort(
        (a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );
  }, [memberEvents, targetMemberIds]);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const fullName = `${m.firstName || ""} ${m.lastName || ""}`.toLowerCase();
      const matchesSearch = fullName.includes(searchTerm.toLowerCase());

      const isGuestMember =
        m.memberType === "guest" ||
        (m.memberType !== "regular" &&
          m.memberType !== "recovery" &&
          m.isGuest);

      if (clientTypeTab === "guest") {
        return matchesSearch && isGuestMember;
      } else {
        return matchesSearch && !isGuestMember;
      }
    });
  }, [members, searchTerm, clientTypeTab]);

  const handleNextStep = () => {
    if (step === 1) {
      if (!selectedMember && !isGuestSale) {
        toast.error("Избор на клиент", {
          description:
            "Моля, изберете член от списъка или продажба на Външен клиент.",
        });
        return;
      }
    }

    if (
      step === 2 &&
      !isGuestSale &&
      (mode === "training" || mode === "recovery")
    ) {
      if (paymentMode === "subscription" && selectedMonthKeys.length === 0) {
        toast.error("Избор на месец", {
          description: "Моля, изберете поне един месец за плащане.",
        });
        return;
      }
      if (paymentMode === "individual" && selectedEventIds.length === 0) {
        toast.error("Избор на процедури/тренировки", {
          description:
            "Моля, изберете поне една процедура/тренировка за плащане.",
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
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId]
    );
  };

  const toggleMonthSelection = (monthKey: string) => {
    setSelectedMonthKeys((prev) =>
      prev.includes(monthKey)
        ? prev.filter((k) => k !== monthKey)
        : [...prev, monthKey]
    );
  };

  const unpaidMonths = useMemo(
    () => monthlyAttendance.filter((m) => m.unpaidCount > 0),
    [monthlyAttendance]
  );

  const allUnpaidMonthsSelected =
    unpaidMonths.length > 0 &&
    unpaidMonths.every((m) => selectedMonthKeys.includes(m.monthKey));

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
              (a: Attendee) =>
                targetMemberIds.includes(a.memberId) &&
                (!a.paymentStatus || a.paymentStatus === "unpaid")
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

  // eslint-disable-next-line sonarjs/cognitive-complexity
  const handleExecuteSale = async () => {
    if (!idToken) return;
    setIsProcessing(true);
    setStep(5);

    const customPrice = parseFloat(price);
    const qty = getSaleQuantity();
    let clientName = "Външен клиент";
    if (selectedMember) {
      if (isFamilySubscription) {
        clientName = familyMembers
          .map((m) => `${m!.firstName} ${m!.lastName}`)
          .join(", ");
      } else {
        clientName = `${selectedMember.firstName} ${selectedMember.lastName}`;
      }
    }

    const selectedLabels = monthlyAttendance
      .filter((m) => selectedMonthKeys.includes(m.monthKey))
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .map((m) => m.monthLabel);

    const targetEventDates = getTargetEventDates();

    const baseSaleData: Record<string, unknown> = {
      siteId: activeBranch || "bkgalabovo",
      memberId: selectedMember ? selectedMember.id : "GUEST_EXTERNAL",
      clientName: clientName,
      saleDate: saleDate,
      items: [
        {
          productId: item.id,
          name: item.name,
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
      type: mode,
    };

    if (mode === "training" || mode === "recovery") {
      baseSaleData.targetEventDates = targetEventDates;
      baseSaleData.paidEventIds = getPaidEventIdsForSale();

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
    }

    const saleData = baseSaleData;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any;
    try {
      if (mode === "product") {
        result = await createSaleAction(idToken, {
          siteId: activeBranch || "bkgalabovo",
          memberId: selectedMember ? selectedMember.id : "GUEST_EXTERNAL",
          clientName: clientName,
          items: [
            {
              productId: item.id,
              name: item.name,
              quantity: qty,
              price: customPrice,
            },
          ],
          totalAmount: totalAmount,
          currency: "EUR",
          paymentMethod: paymentMethod,
          isPaid: isPaid,
          status: "completed",
          note: note || "",
          saleDate: saleDate,
        });
        if (result.success && result.data) {
          result.saleId = result.data.id;
        }
      } else if (mode === "general") {
        result = await executeGeneralServiceSaleAction(
          {
            ...saleData,
            type: "general_service",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
          item.name,
          clientName
        );
      } else if (mode === "recovery") {
        result = await executeTrainingSaleAction(
          idToken,
          {
            ...saleData,
            type: "recovery_service",
          },
          item.name,
          clientName
        );
      } else {
        result = await executeTrainingSaleAction(
          idToken,
          {
            ...saleData,
            type: "training_service",
          },
          item.name,
          clientName
        );
      }

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
      const message =
        error instanceof Error ? error.message : "Неизвестна грешка";
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

  const steps =
    isGuestSale || mode === "product" || mode === "general"
      ? ["Клиент", "Плащане", "Преглед"]
      : ["Клиент", "Присъствия", "Плащане", "Преглед"];
  const totalSteps = steps.length;
  const displayStep = Math.min(step, totalSteps);

  const contextValue: UnifiedSaleWizardContextType = {
    item,
    mode,
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
    quantity,
    setQuantity,
    paymentMethod,
    setPaymentMethod,
    isPaid,
    setIsPaid,
    note,
    setNote,
    saleDate,
    setSaleDate,
    totalAmount,
    selectedMonthLabels,
    toggleEventSelection,
    toggleMonthSelection,
    handleExecuteSale,
    isProcessing,
    completedSaleId,
  };

  return (
    <UnifiedSaleWizardContext.Provider value={contextValue}>
      {children}
    </UnifiedSaleWizardContext.Provider>
  );
};
