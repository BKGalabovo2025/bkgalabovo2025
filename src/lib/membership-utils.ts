import { Member, ClubService } from "@/types";
import {
  LucideIcon,
  Sparkles,
  Users,
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
};

/**
 * Core logic to determine the best membership suggestion for a member
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
  // This is CRITICAL to prevent suggesting "Amateur" services to children
  const compatibleServices = services.filter((s) => {
    const serviceNameLower = s.name.toLowerCase();
    const serviceTargetLower = s.targetGroups.map((tg) => tg.toLowerCase());

    if (isChild) {
      // If member is a child, exclude services explicitly for adults/amateurs
      if (
        serviceNameLower.includes("любители") ||
        serviceTargetLower.includes("любители")
      )
        return false;
      // Also exclude pro services unless member is pro
      if (
        !isPro &&
        (serviceNameLower.includes("състезател") ||
          serviceTargetLower.includes("състезател"))
      )
        return false;

      return (
        s.targetGroups.includes("Деца") ||
        serviceNameLower.includes("деца") ||
        serviceNameLower.includes("детски")
      );
    }

    if (isAmateur) {
      return (
        serviceTargetLower.includes("любители") ||
        serviceNameLower.includes("любители")
      );
    }

    return true; // Default to all if no specific group detected
  });

  // 3. Mandatory Monthly Subscription for Children
  // We keep this as high priority, but don't strictly exclude other options
  const childMonthly = compatibleServices.find(
    (s) => s.billingPeriod === "Месечен"
  );
  if (isChild && attendanceCount > 0 && childMonthly) {
    list.push({
      service: childMonthly,
      reason: `Препоръчителен месечен абонамент за деца${member.ageGroup ? ` (${member.ageGroup})` : ""}`,
      icon: Sparkles,
      priority: 15, // Highest priority
    });
  }

  // 4. Family logic
  if (member.familyId) {
    const familyService = services.find(
      (s) =>
        s.name.toLowerCase().includes("семеен") ||
        s.name.toLowerCase().includes("семейство")
    );
    if (familyService) {
      list.push({
        service: familyService,
        reason: "Открита семейна връзка — възможност за семеен план",
        icon: Users,
        priority: 10,
      });
    }
  }

  // 5. Attendance-based logic for compatible services
  const monthlyServices = compatibleServices.filter(
    (s) => s.billingPeriod === "Месечен"
  );
  const singleServices = compatibleServices.filter(
    (s) => s.billingPeriod === null || s.type === "Еднократно плащане"
  );

  if (attendanceCount > 0) {
    // Determine the best value single service
    const singleService = singleServices.sort((a, b) => a.price - b.price)[0];
    const targetMonthly = monthlyServices[0];

    if (singleService) {
      const projectedCost = attendanceCount * singleService.price;

      // If it's a child and they have few attendances, offer single visit too
      if (isChild && attendanceCount <= 3) {
        list.push({
          service: singleService,
          reason: `Единично посещение (${attendanceCount} присъствия) — алтернатива на месечния абонамент.`,
          icon: Wallet,
          priority: 12, // High priority for children with low attendance
        });
      }

      if (targetMonthly && targetMonthly.price < projectedCost) {
        list.push({
          service: targetMonthly,
          reason: `По-изгоден абонамент при ${attendanceCount} посещения (спестявате ${projectedCost - targetMonthly.price} ${targetMonthly.currency}).`,
          icon: TrendingUp,
          priority: 14,
          bestValue: true,
        });
      } else if (!isChild && attendanceCount <= 3) {
        list.push({
          service: singleService,
          reason: `Ниска активност (${attendanceCount} посещения) — препоръчва се единично плащане.`,
          icon: Wallet,
          priority: 8,
        });
      }
    }
  }

  // 6. Final safety fallback - if we have nothing but there was attendance
  if (list.length === 0 && attendanceCount > 0) {
    const fallback = compatibleServices[0] || services[0];
    if (fallback) {
      list.push({
        service: fallback,
        reason: "Автоматично предложена услуга на база посещения",
        icon: AlertTriangle,
        priority: 1,
      });
    }
  }

  return list.sort((a, b) => b.priority - a.priority);
};
