/* eslint-disable sonarjs/cognitive-complexity */
"use client";

import { useState, useEffect, useMemo } from "react";
import { mutate } from "swr";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ClubService as Service } from "@/types";
import { Member, ScheduleEvent, Attendee } from "@/types";
import { getAllMembers } from "@/services/member-service";
import { getEventsByMemberId } from "@/services/schedule-service";
import { executeTrainingSaleAction } from "@/lib/actions/services";
import { createMemberAction } from "@/lib/actions/members";
import { useAuth } from "@/context/auth-context";
import { formatPrice } from "@/lib/currency";
import { clubInfo } from "@/config/club";
import { useAppStore } from "@/store/use-app-store";
import { format, getYear } from "date-fns";
import { bg } from "date-fns/locale";
import {
  ShoppingBag,
  Search,
  User,
  Check,
  CreditCard,
  Receipt,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Printer,
  Sparkles,
  Calendar,
  CheckSquare,
  CalendarDays,
  AlertCircle,
  PlusCircle,
  Banknote,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RecoverySaleWizardDialogProps {
  service: Service;
  isOpen: boolean;
  onClose: () => void;
  onSaleSuccess: () => void;
}

type PaymentMode = "subscription" | "individual";

interface MemberAttendanceStats {
  memberId: string;
  firstName: string;
  paidCount: number;
  unpaidCount: number;
}

interface MonthAttendance {
  monthKey: string; // yyyy-MM
  monthLabel: string; // e.g. "Януари 2026"
  year: number;
  events: ScheduleEvent[];
  unpaidCount: number;
  paidCount: number;
  memberStats: Record<string, MemberAttendanceStats>;
}

export const RecoverySaleWizardDialog = ({
  service,
  isOpen,
  onClose,
  onSaleSuccess,
}: RecoverySaleWizardDialogProps) => {
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

  // Determine payment mode from service type
  const isSubscriptionService = service.type === "Абонамент";

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
    return (
      isSubscriptionService && service.name.toLowerCase().includes("семеен")
    );
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
      return familyMembers
        .map((m) => `${m?.firstName} ${m?.lastName}`)
        .join(", ");
    }
    return `${selectedMember?.firstName} ${selectedMember?.lastName}`;
  }, [isGuestSale, isFamilySubscription, familyMembers, selectedMember]);

  // Load attendance when member is selected and we move to step 2
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

          // Filter to attended-only events for this training type
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

  // Group events by calendar month
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

      // Find all target members in this event
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

      // Count each attendee record separately so 2 siblings = 2 unpaid/paid items
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

  // Unpaid events for individual selection
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

  const filteredMembers = members.filter((m) => {
    const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

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

  // Months that have at least one unpaid visit
  const unpaidMonths = useMemo(
    () => monthlyAttendance.filter((m) => m.unpaidCount > 0),
    [monthlyAttendance]
  );

  const allUnpaidMonthsSelected =
    unpaidMonths.length > 0 &&
    unpaidMonths.every((m) => selectedMonthKeys.includes(m.monthKey));

  // Total = unitPrice × quantity
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

      // Build month labels for the receipt/notes
      const selectedMonthLabels = monthlyAttendance
        .filter((m) => selectedMonthKeys.includes(m.monthKey))
        .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
        .map((m) => m.monthLabel);

      const targetEventDates = getTargetEventDates();

      const saleData = {
        siteId: activeBranch || "bkgalabovo",
        memberId: isGuestSale ? "GUEST_EXTERNAL" : selectedMember!.id,
        clientName: clientName, // Ensure clientName is saved in the sale document
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
        type: "recovery_service",
        // Attendance linking metadata
        paymentMode: isGuestSale ? null : paymentMode,
        targetMonths: isGuestSale ? null : selectedMonthKeys,
        targetMonthLabels: isGuestSale ? null : selectedMonthLabels,
        targetEventDates: targetEventDates,
        paidEventIds: getPaidEventIdsForSale(),
        memberIdForAttendance: isGuestSale ? null : selectedMember?.id,
        memberIdsForAttendance: isGuestSale ? null : targetMemberIds,
      };

      const result = await executeTrainingSaleAction(
        idToken,
        saleData,
        service.name,
        clientName
      );

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
    } catch (error: any) {
      setStep(4);
      toast.error("Грешка при продажба", {
        description: error.message,
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

  // Step labels
  const steps = isGuestSale
    ? ["Клиент", "Плащане", "Преглед"]
    : ["Клиент", "Присъствия", "Плащане", "Преглед"];
  const totalSteps = steps.length;

  const displayStep = Math.min(step, totalSteps);

  const getMemberButtonClasses = (isSelected: boolean, isGuestTab: boolean) => {
    if (!isSelected)
      return "hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-zinc-800 dark:text-zinc-200";
    return isGuestTab
      ? "bg-amber-500/10 text-amber-950 dark:bg-amber-950/20 dark:text-amber-300"
      : "bg-emerald-50 text-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-300";
  };

  const getMemberAvatarClasses = (isSelected: boolean, isGuestTab: boolean) => {
    if (!isSelected) return "bg-zinc-100 dark:bg-zinc-800 text-zinc-500";
    return isGuestTab ? "bg-amber-500 text-white" : "bg-emerald-500 text-white";
  };

  const renderMembersList = () => {
    if (filteredMembers.length === 0) {
      return (
        <div className="p-8 text-center text-zinc-400 text-xs font-light">
          {clientTypeTab === "guest"
            ? "Няма регистрирани външни гости. Създайте нов гост от бутона вдясно!"
            : "Няма намерени членове по този критерий."}
        </div>
      );
    }

    return filteredMembers.map((member) => {
      const isSelected = selectedMember?.id === member.id;
      const isGuestTab = clientTypeTab === "guest";
      return (
        <button
          key={member.id}
          type="button"
          onClick={() => {
            setSelectedMember(member);
            setIsGuestSale(member.isGuest || false);
          }}
          className={`w-full text-left px-5 py-3.5 flex justify-between items-center transition-colors text-sm font-light ${getMemberButtonClasses(isSelected, isGuestTab)}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-semibold shrink-0",
                getMemberAvatarClasses(isSelected, isGuestTab)
              )}
            >
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
                isGuestTab ? "text-amber-500" : "text-emerald-500"
              )}
            />
          )}
        </button>
      );
    });
  };

  const renderStepDescription = () => {
    if (step === 5) {
      return <span>Регистриране на продажбата...</span>;
    }
    if (step > 5) {
      return <span>Продажбата е завършена успешно. Благодарим ви!</span>;
    }

    const guestSteps = [
      "Избор на клиент",
      "Детайли на плащане",
      "Потвърждение",
    ];
    const memberSteps = [
      "Избор на клиент",
      "Присъствия и период",
      "Начин на плащане",
      "Потвърждение",
    ];
    const currentStepName = isGuestSale
      ? guestSteps[step - 1]
      : memberSteps[step - 1];

    return (
      <span>
        Стъпка {displayStep} от {totalSteps}: {currentStepName}
      </span>
    );
  };

  const renderSubscriptionAttendance = () => {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest">
            Изберете месеци за плащане
          </Label>
          {unpaidMonths.length > 1 && (
            <button
              type="button"
              onClick={() =>
                setSelectedMonthKeys(
                  allUnpaidMonthsSelected
                    ? []
                    : unpaidMonths.map((m) => m.monthKey)
                )
              }
              className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 uppercase tracking-widest transition-colors"
            >
              {allUnpaidMonthsSelected ? "Изчисти" : "Избери всички неплатени"}
            </button>
          )}
        </div>

        {monthlyAttendance.length === 0 ? (
          <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-zinc-100 dark:border-zinc-900">
            <CalendarDays className="h-8 w-8 text-zinc-200 mx-auto mb-3" />
            <p className="text-xs font-light text-zinc-400">
              Няма регистрирани присъствия за {selectedMember?.firstName}.
            </p>
            <p className="text-[10px] font-light text-zinc-300 mt-1">
              Можете да продължите с плащане без свързани присъствия.
            </p>
            <button
              type="button"
              onClick={() => setSelectedMonthKeys(["NO_EVENTS"])}
              className={cn(
                "mt-4 px-4 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-widest transition-all",
                selectedMonthKeys.includes("NO_EVENTS")
                  ? "bg-emerald-500 text-white"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              )}
            >
              {selectedMonthKeys.includes("NO_EVENTS") ? (
                <>
                  <Check className="inline h-3 w-3 mr-1" />
                  Избрано
                </>
              ) : (
                "Продължи без присъствия"
              )}
            </button>
          </div>
        ) : (
          <div className="max-h-[280px] overflow-y-auto space-y-2 custom-scrollbar pr-1">
            {monthlyAttendance.map((monthData) => {
              const isSelected = selectedMonthKeys.includes(monthData.monthKey);
              const hasUnpaid = monthData.unpaidCount > 0;
              return (
                <button
                  key={monthData.monthKey}
                  type="button"
                  onClick={() => toggleMonthSelection(monthData.monthKey)}
                  className={cn(
                    "w-full text-left px-5 py-4 rounded-2xl border transition-all duration-200",
                    isSelected
                      ? "bg-emerald-50 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-700"
                      : "bg-white border-zinc-100 dark:bg-zinc-900/20 dark:border-zinc-800 hover:border-zinc-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* Checkbox */}
                    <div
                      className={cn(
                        "h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-all",
                        isSelected
                          ? "bg-emerald-500 border-emerald-500"
                          : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                      )}
                    >
                      {isSelected && (
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      )}
                    </div>

                    {/* Month info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          isSelected
                            ? "text-emerald-900 dark:text-emerald-200"
                            : "text-zinc-900 dark:text-zinc-100"
                        )}
                      >
                        {monthData.monthLabel}
                      </p>
                      <div className="text-[10px] text-zinc-400 font-light mt-1 flex flex-col gap-0.5">
                        {Object.values(monthData.memberStats).length > 1 ? (
                          Object.values(monthData.memberStats).map((stat) => {
                            const total = stat.paidCount + stat.unpaidCount;
                            if (total === 0) return null;
                            return (
                              <span
                                key={stat.memberId}
                                className={
                                  isSelected
                                    ? "text-emerald-700/70 dark:text-emerald-300/70"
                                    : ""
                                }
                              >
                                • {stat.firstName}: {total} присъстви
                                {total === 1 ? "е" : "я"}
                                {stat.unpaidCount > 0 && (
                                  <span className="text-rose-500 font-medium ml-1">
                                    ({stat.unpaidCount} неплатени)
                                  </span>
                                )}
                              </span>
                            );
                          })
                        ) : (
                          <span
                            className={
                              isSelected
                                ? "text-emerald-700/70 dark:text-emerald-300/70"
                                : ""
                            }
                          >
                            {monthData.paidCount + monthData.unpaidCount}{" "}
                            присъствия общо
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 shrink-0">
                      {monthData.paidCount > 0 && (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[9px] font-semibold uppercase">
                          {monthData.paidCount} платени
                        </span>
                      )}
                      {hasUnpaid ? (
                        <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-100 rounded-full text-[9px] font-semibold uppercase">
                          {monthData.unpaidCount} неплатени
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-zinc-50 text-zinc-400 border border-zinc-100 rounded-full text-[9px] font-semibold uppercase">
                          Изплатен
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Selection summary */}
        {selectedMonthKeys.length > 0 &&
          !selectedMonthKeys.includes("NO_EVENTS") && (
            <div
              className={cn(
                "px-4 py-3 rounded-2xl border flex items-center justify-between",
                selectedMonthKeys.length > 1
                  ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800"
                  : "bg-zinc-50 border-zinc-100 dark:bg-zinc-900/30 dark:border-zinc-800"
              )}
            >
              <div className="flex items-center gap-2">
                <CalendarDays
                  className="h-3.5 w-3.5 text-emerald-600"
                  strokeWidth={2}
                />
                <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-widest">
                  Избрани: {selectedMonthKeys.length}{" "}
                  {selectedMonthKeys.length === 1 ? "месец" : "месеца"}
                </span>
              </div>
              {selectedMonthKeys.length > 1 && (
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  Общо:{" "}
                  {formatPrice(
                    (parseFloat(price) || 0) * selectedMonthKeys.length
                  )}
                </span>
              )}
            </div>
          )}
      </div>
    );
  };

  const renderIndividualAttendance = () => {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest">
            Изберете тренировки за плащане
          </Label>
          {unpaidEvents.length > 0 && (
            <button
              type="button"
              onClick={() =>
                setSelectedEventIds(
                  selectedEventIds.length === unpaidEvents.length
                    ? []
                    : unpaidEvents.map((e) => e.id)
                )
              }
              className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 uppercase tracking-widest"
            >
              {selectedEventIds.length === unpaidEvents.length
                ? "Изчисти"
                : "Избери всички"}
            </button>
          )}
        </div>
        {unpaidEvents.length === 0 ? (
          <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-zinc-100 dark:border-zinc-900">
            <CheckSquare className="h-8 w-8 text-emerald-200 mx-auto mb-3" />
            <p className="text-xs font-light text-zinc-400">
              Няма неплатени тренировки за {selectedMember?.firstName}.
            </p>
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto space-y-2 custom-scrollbar pr-1">
            {unpaidEvents.map((event) => {
              const isChecked = selectedEventIds.includes(event.id);
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => toggleEventSelection(event.id)}
                  className={cn(
                    "w-full text-left px-4 py-3.5 rounded-2xl border transition-all duration-200 flex items-center gap-3",
                    isChecked
                      ? "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
                      : "bg-white border-zinc-100 dark:bg-zinc-900/20 dark:border-zinc-800 hover:border-zinc-200"
                  )}
                >
                  <div
                    className={cn(
                      "h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-all",
                      isChecked
                        ? "bg-blue-500 border-blue-500"
                        : "border-zinc-200 bg-white dark:bg-zinc-900"
                    )}
                  >
                    {isChecked && (
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium truncate",
                        isChecked
                          ? "text-blue-900 dark:text-blue-200"
                          : "text-zinc-900 dark:text-zinc-100"
                      )}
                    >
                      {event.title}
                    </p>
                    <p className="text-[10px] text-zinc-400 font-light mt-0.5">
                      {format(new Date(event.startDate), "dd MMMM yyyy", {
                        locale: bg,
                      })}
                      {event.location && ` · ${event.location}`}
                    </p>
                  </div>
                  {isChecked && (
                    <Check className="h-4 w-4 text-blue-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
        {selectedEventIds.length > 0 && (
          <div className="px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl text-[10px] text-blue-700 font-medium">
            Избрани: {selectedEventIds.length} тренировки
          </div>
        )}
      </div>
    );
  };

  const renderAttendanceSection = () => {
    if (attendanceLoading) {
      return (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-emerald-500 opacity-40" />
          <p className="text-zinc-400 text-xs font-light">
            Зареждане на присъствията...
          </p>
        </div>
      );
    }

    if (paymentMode === "subscription") {
      return renderSubscriptionAttendance();
    }
    return renderIndividualAttendance();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[620px] p-8 sm:p-10 rounded-5xl bg-white dark:bg-zinc-950 border-none shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-light text-zinc-955 dark:text-zinc-50 flex items-center gap-3">
            <ShoppingBag
              className="h-6 w-6 text-emerald-500"
              strokeWidth={1.5}
            />
            Продажба: {service.name}
          </DialogTitle>
          <DialogDescription className="font-light text-zinc-500 mt-1">
            {renderStepDescription()}
          </DialogDescription>
        </DialogHeader>

        {/* STEP PROGRESS BAR */}
        {step <= totalSteps && (
          <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-1.5 rounded-full mb-8 overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${(displayStep / totalSteps) * 100}%` }}
            />
          </div>
        )}

        {/* ===== STEP 1: SELECT BUYER ===== */}
        {step === 1 && (
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
              /* QUICK NEW GUEST FORM */
              <div className="space-y-4 p-5 border border-amber-200 dark:border-amber-900/35 bg-amber-50/20 dark:bg-amber-950/5 rounded-2xl animate-in fade-in duration-300">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                  Регистрация на Нов Външен клиент (Гост)
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-zinc-500">
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
                    <Label className="text-[10px] font-bold uppercase text-zinc-500">
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
                    <Label className="text-[10px] font-bold uppercase text-zinc-500">
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
                    <Label className="text-[10px] font-bold uppercase text-zinc-500">
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
                    onClick={async () => {
                      if (
                        !newGuestFirstName ||
                        !newGuestLastName ||
                        !newGuestPhone
                      ) {
                        toast.error("Непълни данни", {
                          description:
                            "Моля, попълнете Име, Фамилия и Телефон на госта.",
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
                          } as any;

                          setMembers((prev) => [newGuestObj, ...prev]);
                          setSelectedMember(newGuestObj);
                          setIsGuestSale(true);

                          toast.success("Успех!", {
                            description:
                              "Външният клиент беше регистриран и избран успешно.",
                          });

                          setShowNewGuestForm(false);
                          setNewGuestFirstName("");
                          setNewGuestLastName("");
                          setNewGuestPhone("");
                          setNewGuestEmail("");
                          setStep(3); // Guests bypass Step 2 (attendance selection)
                        } else {
                          toast.error("Грешка при регистрация", {
                            description: result.message,
                          });
                        }
                      } catch (err) {
                        console.error("Error creating quick guest:", err);
                        toast.error("Системна грешка при регистрация.");
                      } finally {
                        setIsSavingNewGuest(false);
                      }
                    }}
                    className="rounded-xl text-xs bg-amber-500 hover:bg-amber-600 text-white animate-in"
                  >
                    {isSavingNewGuest ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : null}
                    Регистрирай и избери
                  </Button>
                </div>
              </div>
            ) : (
              /* SELECTION TABS & MEMBER/GUEST SEARCH */
              <div className="space-y-4">
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

                {membersLoading ? (
                  <div className="py-16 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500 opacity-30" />
                    <p className="text-zinc-400 text-xs font-light">
                      Зареждане на списъка...
                    </p>
                  </div>
                ) : (
                  <div className="border border-zinc-100 dark:border-zinc-900 rounded-2xl max-h-[240px] overflow-y-auto divide-y divide-zinc-50 dark:divide-zinc-900 custom-scrollbar">
                    {renderMembersList()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== STEP 2: ATTENDANCE & BILLING CONFIG (for member) ===== */}
        {step === 2 && !isGuestSale && selectedMember && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-900">
              <CalendarDays
                className="h-4 w-4 text-emerald-500"
                strokeWidth={1.5}
              />
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Присъствия и период
              </h3>
            </div>

            {/* Selected member chip */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
              <div className="h-6 w-6 rounded-md bg-emerald-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                {selectedMember.firstName[0]}
                {selectedMember.lastName[0]}
              </div>
              <span className="text-sm font-medium text-emerald-900 dark:text-emerald-300">
                {selectedMember.firstName} {selectedMember.lastName}
              </span>
              <Badge className="ml-auto rounded-full text-[8px] px-2 py-0 border-none bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                {service.type}
              </Badge>
            </div>

            {/* Payment Mode Toggle */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest">
                Тип плащане
              </Label>
              <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-xl p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setPaymentMode("subscription")}
                  className={cn(
                    "flex-1 py-2.5 text-[10px] font-semibold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5",
                    paymentMode === "subscription"
                      ? "bg-white dark:bg-zinc-800 text-emerald-700 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700"
                  )}
                >
                  <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
                  Абонамент (Месец)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode("individual")}
                  className={cn(
                    "flex-1 py-2.5 text-[10px] font-semibold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5",
                    paymentMode === "individual"
                      ? "bg-white dark:bg-zinc-800 text-blue-700 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700"
                  )}
                >
                  <CreditCard className="h-3.5 w-3.5" strokeWidth={2} />
                  Еднократно
                </button>
              </div>
            </div>

            {renderAttendanceSection()}
          </div>
        )}

        {/* ===== STEP 2 (for guest) / STEP 3 (for member): PAYMENT DETAILS ===== */}
        {((step === 2 && isGuestSale) || (step === 3 && !isGuestSale)) && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-900">
              <CreditCard
                className="h-4 w-4 text-emerald-500"
                strokeWidth={1.5}
              />
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Детайли на плащането
              </h3>
            </div>

            <div className="grid gap-5">
              <div className="grid gap-2">
                <Label
                  htmlFor="sale-price"
                  className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
                >
                  Сума (EUR) *
                </Label>
                <Input
                  id="sale-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="rounded-xl h-11 border-zinc-200"
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Начин на плащане *
                </Label>
                <div className="flex gap-3">
                  {[
                    { value: "В брой", icon: Banknote, label: "В брой" },
                    { value: "Revolut", icon: Smartphone, label: "Revolut" },
                  ].map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setPaymentMethod(method.value)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border text-sm font-medium transition-all",
                        paymentMethod === method.value
                          ? "bg-zinc-950 text-white border-zinc-950 dark:bg-white dark:text-zinc-950"
                          : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800"
                      )}
                    >
                      <method.icon className="h-4 w-4" strokeWidth={1.5} />
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Статус на плащане *
                </Label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPaid(true)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border text-sm font-medium transition-all",
                      isPaid
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800"
                    )}
                  >
                    <Check className="h-4 w-4" strokeWidth={2} />
                    Платено
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPaid(false)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border text-sm font-medium transition-all",
                      !isPaid
                        ? "bg-rose-500 text-white border-rose-500"
                        : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800"
                    )}
                  >
                    <AlertCircle className="h-4 w-4" strokeWidth={2} />
                    Неплатено (Дълг)
                  </button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label
                  htmlFor="sale-note"
                  className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
                >
                  Допълнителна бележка (Незадължително)
                </Label>
                <Textarea
                  id="sale-note"
                  placeholder="Добавете коментар..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="rounded-xl border-zinc-200 dark:border-zinc-800 resize-none"
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}

        {/* ===== STEP 3 (guest) / STEP 4 (member): REVIEW ===== */}
        {((step === 3 && isGuestSale) || (step === 4 && !isGuestSale)) && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-900">
              <Sparkles
                className="h-4 w-4 text-emerald-500"
                strokeWidth={1.5}
              />
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Преглед и потвърждение
              </h3>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900/40 p-6 rounded-3xl space-y-4 border border-zinc-100/50 dark:border-zinc-900">
              <div className="flex justify-between items-center text-xs pb-3 border-b border-zinc-200/50 dark:border-zinc-800/50">
                <span className="text-zinc-500">Клиент</span>
                <span className="font-bold text-zinc-900 dark:text-white">
                  {clientDisplayName}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pb-3 border-b border-zinc-200/50 dark:border-zinc-800/50">
                <span className="text-zinc-500">Услуга</span>
                <span className="font-bold text-zinc-900 dark:text-white">
                  {service.name}
                </span>
              </div>
              {!isGuestSale && (
                <>
                  <div className="flex justify-between items-center text-xs pb-3 border-b border-zinc-200/50 dark:border-zinc-800/50">
                    <span className="text-zinc-500">Тип плащане</span>
                    <span className="font-bold text-zinc-900 dark:text-white">
                      {paymentMode === "subscription"
                        ? "Месечен абонамент"
                        : "Еднократно (Индивидуални тренировки)"}
                    </span>
                  </div>
                  {paymentMode === "subscription" &&
                    selectedMonthKeys.length > 0 &&
                    !selectedMonthKeys.includes("NO_EVENTS") && (
                      <div className="flex justify-between items-center text-xs pb-3 border-b border-zinc-200/50 dark:border-zinc-800/50">
                        <span className="text-zinc-500">Период</span>
                        <span className="font-bold text-emerald-600">
                          {selectedMonthLabels.join(", ")}
                        </span>
                      </div>
                    )}
                  {paymentMode === "individual" &&
                    selectedEventIds.length > 0 && (
                      <div className="flex justify-between items-center text-xs pb-3 border-b border-zinc-200/50 dark:border-zinc-800/50">
                        <span className="text-zinc-500">Брой тренировки</span>
                        <span className="font-bold text-blue-600">
                          {selectedEventIds.length} тренировки
                        </span>
                      </div>
                    )}
                </>
              )}
              <div className="flex justify-between items-center text-xs pb-3 border-b border-zinc-200/50 dark:border-zinc-800/50">
                <span className="text-zinc-500">Начин на плащане</span>
                <span className="font-bold text-zinc-900 dark:text-white">
                  {paymentMethod}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pb-3 border-b border-zinc-200/50 dark:border-zinc-800/50">
                <span className="text-zinc-500">Статус</span>
                <span
                  className={`font-bold uppercase tracking-wider text-[10px] ${
                    isPaid ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {isPaid ? "Платено" : "Неплатено (Дълг)"}
                </span>
              </div>
              {note && (
                <div className="flex flex-col gap-1 text-xs pb-3 border-b border-zinc-200/50 dark:border-zinc-800/50">
                  <span className="text-zinc-500">Забележка</span>
                  <span className="font-medium text-zinc-900 dark:text-white italic">
                    {note}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Обща сума
                </span>
                <span className="text-2xl font-bold text-emerald-500 tracking-tight">
                  {formatPrice(totalAmount)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ===== STEP 5: PROCESSING ===== */}
        {step === 5 && (
          <div className="py-20 flex flex-col items-center justify-center space-y-6">
            <Loader2
              className="h-12 w-12 animate-spin text-emerald-500"
              strokeWidth={2}
            />
            <div className="text-center space-y-2">
              <p className="font-light text-zinc-900 dark:text-zinc-100 text-lg">
                Регистриране на продажбата...
              </p>
              <p className="text-zinc-500 text-xs font-light">
                Моля, изчакайте, докато транзакцията се записва в базата данни.
              </p>
            </div>
          </div>
        )}

        {/* ===== STEP 6: RECEIPT & PRINT ===== */}
        {step === 6 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-900">
              <Receipt className="h-4 w-4 text-emerald-500" strokeWidth={1.5} />
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Касова бележка
              </h3>
            </div>

            <div
              className="flex flex-col border border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-950 rounded-2xl relative text-zinc-950 dark:text-zinc-50 w-full max-w-lg mx-auto shadow-sm"
              style={{
                fontFamily: "Arial, Helvetica, sans-serif",
                wordSpacing: "1px",
              }}
            >
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-3 text-[10px]">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-tight text-zinc-900 dark:text-white">
                      РАЗПИСКА ЗА ПЛАЩАНЕ
                    </h4>
                    <p className="text-[9px] font-bold uppercase text-zinc-500">
                      №{" "}
                      {completedSaleId
                        ? completedSaleId.substring(0, 8).toUpperCase()
                        : "N/A"}{" "}
                      / {new Date().toLocaleDateString("bg-BG")} г.
                    </p>
                  </div>
                  <div className="text-right text-[9px] space-y-0.5 text-zinc-500">
                    <p className="font-bold uppercase text-zinc-700 dark:text-zinc-300">
                      {clubInfo.name}
                    </p>
                    <p className="uppercase">{clubInfo.address}</p>
                    <p className="uppercase">{clubInfo.contact}</p>
                  </div>
                </div>

                <div className="mb-3 text-[9px] flex justify-between items-start bg-zinc-50 dark:bg-zinc-900/50 p-2.5 border border-zinc-100 dark:border-zinc-800 rounded-lg">
                  <div>
                    <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest mb-0.5">
                      Получател
                    </p>
                    <p className="font-bold uppercase text-zinc-800 dark:text-zinc-200">
                      {clientDisplayName}
                    </p>
                  </div>
                  <div className="text-right text-zinc-600 dark:text-zinc-400">
                    <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest mb-0.5">
                      Детайли за плащане
                    </p>
                    <p className="font-bold">
                      Дата: {new Date().toLocaleDateString("bg-BG")} г.
                    </p>
                    <p className="mt-0.5">Начин: {paymentMethod}</p>
                    <p className="mt-0.5 font-bold">
                      Статус:{" "}
                      <span
                        className={
                          isPaid
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }
                      >
                        {isPaid ? "ПЛАТЕНО" : "ОЧАКВА ПЛАЩАНЕ"}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mb-3">
                  <table className="w-full border-collapse border border-zinc-200 dark:border-zinc-800 text-[9px]">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-[8px] font-bold uppercase text-zinc-500">
                        <th className="p-1.5 text-left border-r border-zinc-200 dark:border-zinc-800">
                          Описание
                        </th>
                        <th className="p-1.5 text-right">Сума</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 font-medium">
                        <td className="p-1.5 border-r border-zinc-200 dark:border-zinc-800 font-bold text-left text-zinc-800 dark:text-zinc-200">
                          {service.name}
                          {!isGuestSale &&
                            paymentMode === "subscription" &&
                            selectedMonthKeys.length > 0 &&
                            !selectedMonthKeys.includes("NO_EVENTS") && (
                              <span className="ml-1 font-normal text-zinc-500">
                                ({selectedMonthLabels.join(", ")})
                              </span>
                            )}
                          {!isGuestSale &&
                            paymentMode === "individual" &&
                            selectedEventIds.length > 0 && (
                              <span className="ml-1 font-normal text-zinc-500">
                                ({selectedEventIds.length} тренировки
                                {(() => {
                                  const dates = selectedEventIds
                                    .map((id) => {
                                      const ev = memberEvents.find(
                                        (e) => e.id === id
                                      );
                                      return ev
                                        ? new Date(
                                            ev.startDate
                                          ).toLocaleDateString("bg-BG")
                                        : "";
                                    })
                                    .filter(Boolean);
                                  return dates.length > 0
                                    ? ` на ${dates.join(", ")}`
                                    : "";
                                })()}
                                )
                              </span>
                            )}
                        </td>
                        <td className="p-1.5 text-right font-bold text-zinc-800 dark:text-zinc-200">
                          {formatPrice(totalAmount)}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-1.5 text-right border-r border-zinc-200 dark:border-zinc-800 font-bold uppercase text-[8px] text-zinc-400">
                          Обща стойност:
                        </td>
                        <td className="p-1.5 text-right font-bold text-[10px] text-zinc-900 dark:text-white">
                          {formatPrice(totalAmount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {note && (
                  <div className="mb-3 p-2 border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/30 text-[9px] rounded-lg">
                    <span className="font-bold text-zinc-500 uppercase mr-1">
                      Забележка:
                    </span>
                    <span className="italic text-zinc-800 dark:text-zinc-200">
                      {note}
                    </span>
                  </div>
                )}

                <div className="mt-4 text-[7px] text-zinc-400 text-center border-t border-zinc-100 dark:border-zinc-800 pt-3">
                  Документът е издаден съгласно чл. 7, ал. 1 от Закона за
                  счетоводството.
                </div>

                <div className="mt-4 flex justify-between gap-12 text-zinc-500">
                  <div className="flex-1">
                    <div className="h-px bg-zinc-300 dark:bg-zinc-800 w-full" />
                    <p className="text-[7px] font-bold mt-0.5 uppercase text-center">
                      Доставчик: {clubInfo.name}
                    </p>
                  </div>
                  <div className="flex-1">
                    <div className="h-px bg-zinc-300 dark:bg-zinc-800 w-full" />
                    <p className="text-[7px] font-bold mt-0.5 uppercase text-center">
                      Получател:{" "}
                      {isGuestSale
                        ? "Външен клиент"
                        : `${selectedMember?.firstName} ${selectedMember?.lastName}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => {
                  if (completedSaleId) {
                    window.open(`/sales/${completedSaleId}/receipt`, "_blank");
                  }
                }}
                className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 h-11 px-6 text-xs font-semibold flex items-center gap-2"
              >
                <Printer className="h-4 w-4" /> Отвори за печат (PDF)
              </Button>
            </div>
          </div>
        )}

        {/* ===== DIALOG FOOTER: NAVIGATION BUTTONS ===== */}
        {step < 5 && (
          <DialogFooter className="px-8 py-6 border-t border-zinc-100 dark:border-zinc-900 flex flex-row justify-between items-center sm:justify-between w-full">
            <div>
              {step > 1 ? (
                <Button
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={isProcessing}
                  className="rounded-xl px-5 h-11 flex items-center gap-2 text-zinc-500 hover:text-zinc-800"
                >
                  <ArrowLeft className="h-4 w-4" /> Назад
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="rounded-xl px-5 h-11 text-zinc-500 hover:text-zinc-800"
                >
                  Отказ
                </Button>
              )}
            </div>

            <div>
              {(() => {
                const isLastStep = step >= (isGuestSale ? 3 : 4);
                if (isLastStep) {
                  return (
                    <Button
                      onClick={handleExecuteSale}
                      disabled={isProcessing}
                      className="rounded-xl px-8 h-11 bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-2 font-medium text-[11px] uppercase tracking-widest"
                    >
                      Завърши продажбата <Check className="h-4 w-4" />
                    </Button>
                  );
                }
                return (
                  <Button
                    onClick={handleNextStep}
                    disabled={isProcessing}
                    className="rounded-xl px-6 h-11 bg-zinc-950 hover:bg-zinc-800 text-white flex items-center gap-2 font-medium text-[11px] uppercase tracking-widest"
                  >
                    Напред <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                );
              })()}
            </div>
          </DialogFooter>
        )}

        {step === 6 && (
          <DialogFooter className="px-8 py-6 border-t border-zinc-100 dark:border-zinc-900 flex justify-end">
            <Button
              onClick={handleClose}
              className="rounded-xl px-8 h-11 bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-[11px] uppercase tracking-widest"
            >
              Затвори
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
