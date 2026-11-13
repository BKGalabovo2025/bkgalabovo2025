"use server";
import "server-only";

import { cookies } from "next/headers";

import {
  calculateTripStatementTotals,
  calculateTripTransportTotals,
} from "@/lib/business-trip-calc";
import { getCachedSalesForBranch } from "@/lib/db/sales";
import { getAdminDb } from "@/lib/firebase-admin";
import { getAllMembersServer } from "@/services/member-service.server";
import { Member, Sale } from "@/types";
import { BusinessTrip, TripExpense } from "@/types/business-trip.types";

export interface FinancialReportData {
  total: number;
  tripsExpensesTotal: number;
  tripsCount: number;
  netBalance: number;
  chartData: { name: string; value: number; color: string }[];
  sales: (Sale & { memberName: string; linkedMemberName?: string | null })[];
}

export async function generateFinancialReportAction(
  startDateStr: string | null,
  endDateStr: string | null,
  paymentType: string = "all"
): Promise<FinancialReportData> {
  const cookieStore = await cookies();
  const activeBranch = cookieStore.get("activeBranch")?.value || "bkgalabovo";

  const [allSales, allMembers] = await Promise.all([
    getCachedSalesForBranch(activeBranch),
    getAllMembersServer(),
  ]);

  const memberMap = new Map<string, Member>(allMembers.map((m) => [m.id!, m]));

  const startDate = startDateStr ? new Date(startDateStr) : null;
  if (startDate) startDate.setHours(0, 0, 0, 0);

  const endDate = endDateStr ? new Date(endDateStr) : null;
  if (endDate) endDate.setHours(23, 59, 59, 999);

  // Filter on the server
  const filteredSales = allSales.filter((s) => {
    const saleDate = new Date(s.saleDate);

    const isInDateRange =
      (!startDate || saleDate >= startDate) &&
      (!endDate || saleDate <= endDate);

    const isTypeMatch =
      paymentType === "all" ||
      s.type === paymentType ||
      (!s.type && paymentType === "inventory");

    return isInDateRange && isTypeMatch && s.type !== "camp_fee";
  });

  const paidSales = filteredSales.filter((s) => s.isPaid !== false);
  const totalRevenue = paidSales.reduce((acc, s) => acc + s.totalAmount, 0);

  let shopRev = 0;
  let trainingRev = 0;
  let generalRev = 0;
  let recoveryRev = 0;

  for (const s of paidSales) {
    const saleType = s.type as string | undefined;
    if (saleType === "training_service") {
      trainingRev += s.totalAmount;
    } else if (saleType === "general_service") {
      generalRev += s.totalAmount;
    } else if (saleType === "recovery_service") {
      recoveryRev += s.totalAmount;
    } else {
      shopRev += s.totalAmount;
    }
  }

  const chartData = [
    { name: "Екипировка и Магазин", value: shopRev, color: "#2563eb" },
    { name: "Тренировки и Карти", value: trainingRev, color: "#10b981" },
    { name: "Услуги", value: generalRev, color: "#f59e0b" },
    { name: "Recovery Zone", value: recoveryRev, color: "#8b5cf6" },
  ].filter((d) => d.value > 0);

  // Sort latest first and map member names to reduce client-side mapping
  const enrichedSales = filteredSales
    .sort(
      (a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
    )
    .map((s) => {
      const member = s.memberId ? memberMap.get(s.memberId) : null;
      const memberFullName = member
        ? `${member.firstName} ${member.lastName}`.trim()
        : "";
      const clientName = (s.clientName || "").trim();

      // If clientName is provided and differs from linked member (e.g. parent booking recovery zone with shared phone),
      // prioritize the actual client who made the booking/purchase!
      let memberName = clientName || memberFullName || "Гост";
      let linkedMemberName: string | null = null;
      if (
        clientName &&
        memberFullName &&
        clientName.toLowerCase() !== memberFullName.toLowerCase() &&
        clientName !== "Външен клиент" &&
        clientName !== "Външен гост"
      ) {
        memberName = clientName;
        linkedMemberName = memberFullName;
      } else if (!clientName && memberFullName) {
        memberName = memberFullName;
      }

      return {
        ...s,
        memberName,
        linkedMemberName,
      };
    });

  let tripsExpensesTotal = 0;
  let tripsCount = 0;
  try {
    const adminDb = getAdminDb();
    const [tripsSnap, expensesSnap] = await Promise.all([
      adminDb
        .collection("business_trips")
        .where("siteId", "==", activeBranch)
        .get(),
      adminDb
        .collection("trip_expenses")
        .where("siteId", "==", activeBranch)
        .get(),
    ]);

    const expensesByTrip: Record<string, TripExpense[]> = {};
    expensesSnap.docs.forEach((doc) => {
      const exp = { id: doc.id, ...doc.data() } as TripExpense;
      if (exp.tripId) {
        if (!expensesByTrip[exp.tripId]) expensesByTrip[exp.tripId] = [];
        expensesByTrip[exp.tripId].push(exp);
      }
    });

    tripsSnap.docs.forEach((doc) => {
      const trip = { id: doc.id, ...doc.data() } as BusinessTrip;
      const tripDate = new Date(trip.startDate);
      const isInRange =
        (!startDate || tripDate >= startDate) &&
        (!endDate || tripDate <= endDate);
      if (!isInRange) return;

      tripsCount += 1;
      const tripExps = expensesByTrip[doc.id] || [];
      const { calcPerDiemEUR: calcPerDiem, calcAccomEUR: calcAccom } =
        calculateTripStatementTotals(trip);
      const calcEntry = trip.financials?.entryFeeEUR || 0;
      const transportCalc = calculateTripTransportTotals(trip);
      const calcFuel = transportCalc.calcFuelEUR;

      let expPerDiem = 0;
      let expAccom = 0;
      let expEntry = 0;
      let expOther = 0;
      const fuelExpenses = tripExps.filter((e) => e.expenseType === "fuel");
      const transportExpenses = tripExps.filter(
        (e) => e.expenseType === "transport"
      );

      const avgPricePerLiterEUR =
        fuelExpenses.length > 0
          ? fuelExpenses.reduce((sum, e) => sum + e.amountEUR, 0) /
            fuelExpenses.length
          : 0;
      const effectiveDistKm =
        transportCalc.effectiveDistanceKm > 0
          ? transportCalc.effectiveDistanceKm
          : (trip.vehicle?.distanceKm ?? 0);
      let finalFuelEUR = calcFuel;
      if (
        fuelExpenses.length > 0 &&
        effectiveDistKm > 0 &&
        trip.vehicle?.fuelNorm
      ) {
        const totalLiters = (effectiveDistKm / 100) * trip.vehicle.fuelNorm;
        const finalFuelBGN =
          totalLiters * (Math.round(avgPricePerLiterEUR * 1.95583 * 100) / 100);
        finalFuelEUR = finalFuelBGN > 0 ? finalFuelBGN / 1.95583 : 0;
      }
      const expTransport = transportExpenses.reduce(
        (sum, e) => sum + e.amountEUR,
        0
      );
      tripExps.forEach((ex) => {
        if (ex.expenseType === "accommodation") expAccom += ex.amountEUR;
        else if (ex.expenseType === "food") expPerDiem += ex.amountEUR;
        else if (ex.expenseType === "entry_fee") expEntry += ex.amountEUR;
        else if (ex.expenseType !== "fuel" && ex.expenseType !== "transport") {
          expOther += ex.amountEUR;
        }
      });

      const perDiemTotal = expPerDiem > 0 ? expPerDiem : calcPerDiem;
      const accomTotal = expAccom > 0 ? expAccom : calcAccom;
      const entryTotal = expEntry > 0 ? expEntry : calcEntry;
      const fuelTotal =
        (fuelExpenses.length > 0 ? finalFuelEUR : calcFuel) + expTransport;

      tripsExpensesTotal +=
        perDiemTotal + accomTotal + entryTotal + fuelTotal + expOther;
    });
  } catch (err) {
    console.warn("Неуспешно зареждане на разходи по командировки:", err);
  }

  return {
    total: totalRevenue,
    tripsExpensesTotal,
    tripsCount,
    netBalance: totalRevenue - tripsExpensesTotal,
    chartData,
    sales: enrichedSales,
  };
}
