import { Member, ClubService, Subscription, Sale } from "@/types";
import {
  LucideIcon,
  Sparkles,
  TrendingUp,
  Wallet,
  AlertTriangle,
} from "lucide-react";

export type SuggestionPriority = {
  service: ClubService;
  reason: string;
  icon: LucideIcon;
  priority: number;
  bestValue?: boolean;
  suggestedPrice?: number;
  suggestedServiceName?: string;
};

/**
 * Core logic to determine the best membership suggestion for a member based on attendance
 */
export const getMembershipSuggestions = (
  member: Member,
  services: ClubService[],
  attendanceCount: number
): SuggestionPriority[] => {
  const list: SuggestionPriority[] = [];

  // 1. Determine group characteristics
  const isChild =
    member.ageGroup?.toLowerCase().includes("деца") ||
    member.ageGroup?.toUpperCase().startsWith("U") ||
    (member.dateOfBirth &&
      new Date().getFullYear() - new Date(member.dateOfBirth).getFullYear() <
        18);

  const isAmateur = member.ageGroup?.toLowerCase().includes("любители");
  const isPro = member.ageGroup?.toLowerCase().includes("състезател");

  // 2. Pre-filter services to only those that match the member's age group
  const compatibleServices = services.filter((s) => {
    const serviceNameLower = s.name.toLowerCase();
    const serviceTargetLower = s.targetGroups.map((tg) => tg.toLowerCase());

    if (isChild) {
      if (
        serviceNameLower.includes("любители") ||
        serviceTargetLower.includes("любители")
      )
        return false;
      if (
        !isPro &&
        (serviceNameLower.includes("състезател") ||
          serviceTargetLower.includes("състезател"))
      )
        return false;

      return (
        s.targetGroups.includes("Деца") ||
        serviceNameLower.includes("деца") ||
        serviceNameLower.includes("детски") ||
        s.billingPeriod === null ||
        s.type === "Еднократно плащане"
      );
    }

    if (isAmateur) {
      return (
        serviceTargetLower.includes("любители") ||
        serviceNameLower.includes("любители")
      );
    }

    return true;
  });

  const monthlyServices = compatibleServices.filter(
    (s) => s.billingPeriod === "Месечен"
  );
  const singleServices = compatibleServices.filter(
    (s) => s.billingPeriod === null || s.type === "Еднократно плащане"
  );

  const singleService = singleServices.sort((a, b) => a.price - b.price)[0];
  let effectiveMonthly = monthlyServices[0];

  // Family override for monthly service
  if (member.familyId) {
    const familyService = services.find((s) => {
      const name = s.name.toLowerCase();
      return (
        name.includes("семеен") ||
        name.includes("семейн") ||
        name.includes("семейств")
      );
    });
    if (familyService) {
      effectiveMonthly = familyService;
    }
  }

  const isFamily = !!member.familyId;
  const visits = attendanceCount > 0 ? attendanceCount : 1;
  const projectedCost = visits * (singleService?.price || 0);

  if (singleService && effectiveMonthly) {
    if (
      projectedCost <= effectiveMonthly.price &&
      attendanceCount > 0 &&
      !isFamily
    ) {
      list.push({
        service: singleService,
        reason: `${visits} посетени тренировки през месеца × ${singleService.price} ${singleService.currency} (по-изгодно от месечен абонамент)`,
        icon: Wallet,
        priority: 25,
        bestValue: true,
        suggestedPrice: projectedCost,
        suggestedServiceName: `${singleService.name} (${visits} посещени${visits === 1 ? "е" : "я"})`,
      });

      list.push({
        service: effectiveMonthly,
        reason: `${member.familyId ? "Семеен месечен абонамент" : "Месечен абонамент"} (стандартна цена ${effectiveMonthly.price} ${effectiveMonthly.currency})`,
        icon: Sparkles,
        priority: 15,
        suggestedPrice: effectiveMonthly.price,
        suggestedServiceName: effectiveMonthly.name,
      });
    } else {
      const savings = projectedCost - effectiveMonthly.price;
      const savingsText =
        savings > 0
          ? ` (спестявате ${savings} ${effectiveMonthly.currency} спрямо единични)`
          : "";
      const priceCompareText =
        savings > 0 ? " (по-скъпо от месечен абонамент)" : "";

      list.push({
        service: effectiveMonthly,
        reason: `${member.familyId ? "Семеен месечен абонамент" : "Месечен абонамент"}${attendanceCount > 0 ? savingsText : ` (стандартна цена ${effectiveMonthly.price} ${effectiveMonthly.currency})`}`,
        icon: TrendingUp,
        priority: 25,
        bestValue: true,
        suggestedPrice: effectiveMonthly.price,
        suggestedServiceName: effectiveMonthly.name,
      });

      list.push({
        service: singleService,
        reason: `${visits} посетен${visits === 1 ? "а" : "и"} тренировк${visits === 1 ? "а" : "и"} × ${singleService.price} ${singleService.currency}${attendanceCount > 0 ? priceCompareText : ""}`,
        icon: Wallet,
        priority: 15,
        suggestedPrice: projectedCost,
        suggestedServiceName: `${singleService.name} (${visits} посещени${visits === 1 ? "е" : "я"})`,
      });
    }
  } else if (effectiveMonthly) {
    list.push({
      service: effectiveMonthly,
      reason: `${member.familyId ? "Семеен месечен абонамент" : "Месечен абонамент"} (${effectiveMonthly.price} ${effectiveMonthly.currency})`,
      icon: Sparkles,
      priority: 25,
      bestValue: true,
      suggestedPrice: effectiveMonthly.price,
      suggestedServiceName: effectiveMonthly.name,
    });
  } else if (singleService) {
    list.push({
      service: singleService,
      reason: `${visits} посетен${visits === 1 ? "а" : "и"} тренировк${visits === 1 ? "а" : "и"} × ${singleService.price} ${singleService.currency}`,
      icon: Wallet,
      priority: 25,
      bestValue: true,
      suggestedPrice: projectedCost,
      suggestedServiceName: `${singleService.name} (${visits} посещени${visits === 1 ? "е" : "я"})`,
    });
  }

  // Final safety fallback
  if (list.length === 0 && services.length > 0) {
    const fallback = compatibleServices[0] || services[0];
    if (fallback) {
      list.push({
        service: fallback,
        reason: "Стандартна клубна услуга",
        icon: AlertTriangle,
        priority: 1,
        suggestedPrice: fallback.price,
        suggestedServiceName: fallback.name,
      });
    }
  }

  return list.sort((a, b) => b.priority - a.priority);
};

/**
 * Unified logic to check if a member's payment is overdue based on active subscriptions or payment history.
 * Supports chronological obligation list including unpaid sales.
 */
export const checkIsMemberOverdue = (
  member: Member,
  subscriptions: Subscription[] = [],
  familyMembers: Member[] = [],
  sales: Sale[] = []
): { isOverdue: boolean; reason: string } => {
  if (member.status !== "active") {
    return { isOverdue: false, reason: "Неактивен член" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Chronological obligations list
  type Obligation = {
    date: Date;
    description: string;
    amount: number;
    type: "subscription" | "sale";
  };

  const obligations: Obligation[] = [];

  // 1. Check pending subscriptions
  const pendingSubs = subscriptions.filter(
    (sub) => sub.status === "pending_payment"
  );

  pendingSubs.forEach((sub) => {
    let namePrefix = "";
    if (sub.memberId !== member.id && familyMembers.length > 0) {
      const sibling = familyMembers.find((m) => m.id === sub.memberId);
      if (sibling) {
        namePrefix = `${sibling.firstName}: `;
      } else {
        namePrefix = "Семейство: ";
      }
    }
    obligations.push({
      date: new Date(sub.startDate),
      description: `${namePrefix}${sub.serviceName}`,
      amount: sub.price - sub.pricePaid,
      type: "subscription",
    });
  });

  // 2. Check pending/unpaid sales for member and family
  const targetMemberIds = [member.id, ...familyMembers.map((m) => m.id)];
  const pendingSales = sales.filter(
    (sale) =>
      targetMemberIds.includes(sale.memberId || "") &&
      (sale.status === "pending" || sale.isPaid === false)
  );

  pendingSales.forEach((sale) => {
    // Ignore if it's already linked to a pending subscription in our list
    if (
      sale.subscriptionId &&
      pendingSubs.some((s) => s.id === sale.subscriptionId)
    ) {
      return;
    }

    let namePrefix = "";
    if (sale.memberId !== member.id && familyMembers.length > 0) {
      const sibling = familyMembers.find((m) => m.id === sale.memberId);
      if (sibling) {
        namePrefix = `${sibling.firstName}: `;
      } else {
        namePrefix = "Семейство: ";
      }
    }

    const itemsStr =
      sale.items.map((i) => i.name).join(", ") || "Услуга/Продукт";

    obligations.push({
      date: new Date(sale.saleDate),
      description: `${namePrefix}${itemsStr}`,
      amount: sale.totalAmount,
      type: "sale",
    });
  });

  // If there are any pending obligations, return them sorted chronologically (oldest first)
  if (obligations.length > 0) {
    obligations.sort((a, b) => a.date.getTime() - b.date.getTime());
    const totalDue = obligations.reduce((sum, o) => sum + o.amount, 0);

    const details = obligations
      .map((o) => {
        const dateStr = o.date.toLocaleDateString("bg-BG", {
          month: "2-digit",
          year: "numeric",
        });
        return `${o.description} (${dateStr} - ${o.amount} €)`;
      })
      .join(", ");

    return {
      isOverdue: true,
      reason: `Дължи общо ${totalDue} € за: ${details}`,
    };
  }

  // 3. Look for any subscription that is paid (active/expired but paid) covering today,
  // or active subscription that has not expired
  const activeOrPaidSub = subscriptions.find((sub) => {
    if (sub.status === "cancelled") return false;

    const serviceNameLower = sub.serviceName.toLowerCase();
    const isSharedFamilySub =
      serviceNameLower.includes("семеен") ||
      serviceNameLower.includes("семейн") ||
      serviceNameLower.includes("семейств");

    if (sub.memberId !== member.id && !isSharedFamilySub) return false;

    const sStart = new Date(sub.startDate);
    sStart.setHours(0, 0, 0, 0);
    const sEnd = new Date(sub.endDate);
    sEnd.setHours(23, 59, 59, 999);

    // Check if today falls within start and end date
    const isCurrentlyRunning = today >= sStart && today <= sEnd;
    // Or if it is explicitly active and not expired yet
    const isActiveAndNotExpired = sub.status === "active" && today <= sEnd;

    return isActiveAndNotExpired || (isCurrentlyRunning && sub.pricePaid > 0);
  });

  if (activeOrPaidSub) {
    const endStr = new Date(activeOrPaidSub.endDate).toLocaleDateString(
      "bg-BG"
    );
    return {
      isOverdue: false,
      reason: `Има активен/платен абонамент: ${activeOrPaidSub.serviceName} (до ${endStr})`,
    };
  }

  // 4. Fallback to registrationDate and lastPaymentDate if no subscriptions are found
  const registrationDate = member.registrationDate
    ? new Date(member.registrationDate)
    : new Date();
  const lastPayment = member.lastPaymentDate
    ? new Date(member.lastPaymentDate)
    : null;

  // If newly registered (within last 30 days) and no payment yet, they are in grace period
  const daysSinceRegistration = Math.floor(
    (today.getTime() - registrationDate.getTime()) / (1000 * 3600 * 24)
  );

  if (!lastPayment) {
    if (daysSinceRegistration <= 30) {
      return {
        isOverdue: false,
        reason: "Новорегистриран член (гратисен период)",
      };
    }
    return {
      isOverdue: true,
      reason: "Няма регистрирани плащания и абонаменти",
    };
  }

  const daysSinceLastPayment = Math.floor(
    (today.getTime() - lastPayment.getTime()) / (1000 * 3600 * 24)
  );
  if (daysSinceLastPayment > 30) {
    return {
      isOverdue: true,
      reason: `Изтекъл 30-дневен период от последно плащане (${daysSinceLastPayment} дни)`,
    };
  }

  const lastPayStr = lastPayment.toLocaleDateString("bg-BG");
  return {
    isOverdue: false,
    reason: `Платена такса на ${lastPayStr} (в рамките на 30 дни)`,
  };
};
