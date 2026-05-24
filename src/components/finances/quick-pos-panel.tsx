"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Member, Subscription, Sale, ClubService, Family } from "@/types";
import { getAllMembers } from "@/services/member-service";
import {
  getAllClubServices,
  getAllMemberSubscriptions,
} from "@/services/subscription-service";
import { getSales } from "@/services/sales-service";
import { checkIsMemberOverdue } from "@/lib/membership-utils";
import { RegisterPaymentDialog } from "@/components/subscriptions/register-payment-dialog";
import { AddSubscriptionDialog } from "@/components/members/member-subscriptions-tab";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/currency";
import { useAuth } from "@/context/auth-context";
import { Search, Users, Loader2, AlertTriangle } from "lucide-react";

export const QuickPOSPanel = () => {
  const { user, idToken } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshCount, setRefreshCount] = useState(0);

  // States for dynamic dialogs
  const [activePaymentSub, setActivePaymentSub] = useState<any | null>(null);
  const [activeAddMemberId, setActiveAddMemberId] = useState<string | null>(
    null
  );

  const refreshData = () => setRefreshCount((c) => c + 1);

  // Fetch all POS relevant data in parallel
  const { data, isLoading } = useSWR(
    ["quick-pos-data", refreshCount],
    async () => {
      const familiesRef = collection(db, "families");
      const [
        fetchedServices,
        fetchedMembers,
        allSubscriptions,
        allSales,
        familySnapshot,
      ] = await Promise.all([
        getAllClubServices(),
        getAllMembers(),
        getAllMemberSubscriptions(),
        getSales(),
        getDocs(familiesRef),
      ]);
      const families = familySnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Family[];
      return {
        fetchedServices,
        fetchedMembers,
        allSubscriptions,
        allSales,
        families,
      };
    },
    { revalidateOnFocus: false }
  );

  const {
    services = [],
    members = [],
    subscriptions = [],
    sales = [],
    families = [],
  } = (data || {}) as any;

  // Group debtors & family accounts
  const posBillingData = useMemo(() => {
    if (!data)
      return { familyDebtors: [], individualDebtors: [], allActiveMembers: [] };

    const familyMap = new Map<
      string,
      {
        family: Family;
        members: Member[];
        totalDue: number;
        obligations: any[];
      }
    >();
    const individualDebtorsList: {
      member: Member;
      totalDue: number;
      obligations: any[];
    }[] = [];

    const memberOverdueMap = new Map<
      string,
      { isOverdue: boolean; totalDue: number; obligations: any[] }
    >();

    (members as Member[]).forEach((member: Member) => {
      if (member.status !== "active") return;

      const memberSubs = (subscriptions as Subscription[]).filter(
        (s: Subscription) => s.memberId === member.id
      );
      const memberSales = (sales as Sale[]).filter(
        (s: Sale) => s.memberId === member.id
      );

      const siblingMembers = member.familyId
        ? (members as Member[]).filter(
            (m: Member) => m.familyId === member.familyId && m.id !== member.id
          )
        : [];

      const check = checkIsMemberOverdue(
        member,
        memberSubs,
        siblingMembers,
        memberSales
      );

      if (check.isOverdue) {
        const pendingSubs = memberSubs.filter(
          (sub: Subscription) => sub.status === "pending_payment"
        );
        const pendingSales = memberSales.filter(
          (sale: Sale) =>
            (sale.status === "pending" || sale.isPaid === false) &&
            (!sale.subscriptionId ||
              !pendingSubs.some(
                (s: Subscription) => s.id === sale.subscriptionId
              ))
        );

        const obs = [
          ...pendingSubs.map((sub: Subscription) => ({
            id: sub.id,
            date: new Date(sub.startDate),
            description: sub.serviceName,
            amount: sub.price - sub.pricePaid,
            type: "subscription" as const,
            data: sub,
          })),
          ...pendingSales.map((sale: Sale) => ({
            id: sale.id,
            date: new Date(sale.saleDate),
            description:
              sale.items.map((i: any) => i.name).join(", ") || "Услуга/Продукт",
            amount: sale.totalAmount,
            type: "sale" as const,
            data: sale,
          })),
        ];

        obs.sort((a, b) => a.date.getTime() - b.date.getTime());
        const totalDue = obs.reduce((sum, o) => sum + o.amount, 0);

        memberOverdueMap.set(member.id, {
          isOverdue: true,
          totalDue,
          obligations: obs,
        });
      }
    });

    // Group into families vs individuals
    (members as Member[]).forEach((member: Member) => {
      const overdueInfo = memberOverdueMap.get(member.id);
      if (!overdueInfo) return;

      if (member.familyId) {
        const fam = (families as Family[]).find(
          (f: Family) => f.id === member.familyId
        );
        if (fam) {
          if (!familyMap.has(member.familyId)) {
            familyMap.set(member.familyId, {
              family: fam,
              members: [member],
              totalDue: overdueInfo.totalDue,
              obligations: overdueInfo.obligations.map((o: any) => ({
                ...o,
                memberId: member.id,
                memberName: `${member.firstName} ${member.lastName}`,
              })),
            });
          } else {
            const entry = familyMap.get(member.familyId)!;
            entry.members.push(member);
            entry.totalDue += overdueInfo.totalDue;
            entry.obligations.push(
              ...overdueInfo.obligations.map((o: any) => ({
                ...o,
                memberId: member.id,
                memberName: `${member.firstName} ${member.lastName}`,
              }))
            );
          }
        } else {
          individualDebtorsList.push({
            member,
            totalDue: overdueInfo.totalDue,
            obligations: overdueInfo.obligations,
          });
        }
      } else {
        individualDebtorsList.push({
          member,
          totalDue: overdueInfo.totalDue,
          obligations: overdueInfo.obligations,
        });
      }
    });

    familyMap.forEach((entry) => {
      entry.obligations.sort((a, b) => a.date.getTime() - b.date.getTime());
    });

    const activeMembersList = (members as Member[]).filter(
      (m: Member) => m.status === "active"
    );

    return {
      familyDebtors: Array.from(familyMap.values()).sort(
        (a, b) => b.totalDue - a.totalDue
      ),
      individualDebtors: individualDebtorsList.sort(
        (a, b) => b.totalDue - a.totalDue
      ),
      allActiveMembers: activeMembersList,
    };
  }, [data, members, subscriptions, sales, families]);

  // Filtering search queries
  const searchedMembers = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return posBillingData.allActiveMembers.filter((m: Member) =>
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(query)
    );
  }, [searchQuery, posBillingData.allActiveMembers]);

  const handleOpenPayment = (obligation: any) => {
    if (obligation.type === "subscription") {
      setActivePaymentSub(obligation.data);
    } else {
      // For one-off sale payments, map to sub-compatible structure
      setActivePaymentSub({
        id: obligation.id,
        memberId: obligation.data.memberId,
        serviceId: "one_off_sale",
        serviceName: obligation.description,
        startDate: obligation.data.saleDate,
        endDate: obligation.data.saleDate,
        status: "pending_payment",
        price: obligation.amount,
        pricePaid: 0,
        currency: "EUR",
        paymentHistory: [],
        paymentsMadeCount: 0,
        totalPaymentsCount: 1,
      });
    }
  };

  const handlePayFullDebtor = (obligations: any[]) => {
    if (obligations.length > 0) {
      handleOpenPayment(obligations[0]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2
          className="h-10 w-10 animate-spin text-zinc-200"
          strokeWidth={1.5}
        />
      </div>
    );
  }

  const totalDuesSum =
    posBillingData.familyDebtors.reduce((sum, f) => sum + f.totalDue, 0) +
    posBillingData.individualDebtors.reduce((sum, i) => sum + i.totalDue, 0);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Dynamic Payment Dialog */}
      {activePaymentSub && (
        <RegisterPaymentDialog
          sub={activePaymentSub}
          onPaymentSuccess={() => {
            refreshData();
            setActivePaymentSub(null);
          }}
          idToken={idToken}
          open={!!activePaymentSub}
          onOpenChange={(open) => !open && setActivePaymentSub(null)}
        />
      )}

      {/* Dynamic Add dialog */}
      {activeAddMemberId && (
        <AddSubscriptionDialog
          memberId={activeAddMemberId}
          services={services as ClubService[]}
          onSubscriptionAdded={() => {
            refreshData();
            setActiveAddMemberId(null);
          }}
          user={user}
          idToken={idToken}
          externalOpen={!!activeAddMemberId}
          onExternalOpenChange={(open) => !open && setActiveAddMemberId(null)}
        />
      )}

      {/* POS Quick Search & Action Header */}
      <div className="bg-zinc-50 border border-zinc-100 rounded-5xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-zinc-100/50 to-transparent pointer-events-none" />
        <div className="max-w-2xl space-y-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-light tracking-tight text-zinc-950 flex items-center gap-2">
              <Users className="h-6 w-6 text-zinc-650" strokeWidth={1.5} />
              Бързо търсене & POS Каса
            </h3>
            <p className="text-xs font-light text-zinc-400 mt-1">
              Въведете име на член за плащане на дълг, генериране на абонамент
              или продажба.
            </p>
          </div>

          <div className="relative flex items-center">
            <Search
              className="absolute left-4 h-5 w-5 text-zinc-400 pointer-events-none"
              strokeWidth={1.5}
            />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Потърсете член на клуба (напр. Самуил, Вероника)..."
              className="h-14 rounded-2xl border-zinc-200 bg-white pl-12 pr-4 shadow-sm text-sm font-light focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 placeholder-zinc-300"
            />
          </div>

          {/* Search results */}
          {searchQuery.trim() && (
            <div className="bg-white border border-zinc-100 rounded-3xl p-4 shadow-xl space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar animate-in slide-in-from-top-1 duration-200">
              {searchedMembers.length === 0 ? (
                <div className="py-6 text-center text-xs font-light text-zinc-400">
                  Няма намерени членове за &quot;{searchQuery}&quot;
                </div>
              ) : (
                searchedMembers.map((m: Member) => {
                  const siblingMembers = m.familyId
                    ? (members as Member[]).filter(
                        (sm: Member) =>
                          sm.familyId === m.familyId && sm.id !== m.id
                      )
                    : [];
                  const isOverdue = checkIsMemberOverdue(
                    m,
                    (subscriptions as Subscription[]).filter(
                      (s: Subscription) => s.memberId === m.id
                    ),
                    siblingMembers,
                    (sales as Sale[]).filter((s: Sale) => s.memberId === m.id)
                  ).isOverdue;

                  return (
                    <div
                      key={`search-res-${m.id}`}
                      className="flex items-center justify-between p-3 rounded-2xl hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-100/50"
                    >
                      <div>
                        <p className="font-semibold text-sm text-zinc-950">
                          {m.firstName} {m.lastName}
                        </p>
                        <p className="text-[10px] font-light text-zinc-450 uppercase mt-0.5 tracking-wider">
                          Група: {m.ageGroup || "Деца"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {isOverdue && (
                          <Button
                            onClick={() => {
                              // Find their obligations
                              const mSubs = (
                                subscriptions as Subscription[]
                              ).filter(
                                (s: Subscription) => s.memberId === m.id
                              );
                              const mSales = (sales as Sale[]).filter(
                                (s: Sale) => s.memberId === m.id
                              );
                              const pendingSubs = mSubs.filter(
                                (sub: Subscription) =>
                                  sub.status === "pending_payment"
                              );
                              const pendingSales = mSales.filter(
                                (sale: Sale) =>
                                  (sale.status === "pending" ||
                                    sale.isPaid === false) &&
                                  (!sale.subscriptionId ||
                                    !pendingSubs.some(
                                      (s: Subscription) =>
                                        s.id === sale.subscriptionId
                                    ))
                              );
                              const firstObligation = [
                                ...pendingSubs.map((s: Subscription) => ({
                                  id: s.id,
                                  type: "subscription" as const,
                                  description: s.serviceName,
                                  amount: s.price - s.pricePaid,
                                  data: s,
                                })),
                                ...pendingSales.map((s: Sale) => ({
                                  id: s.id,
                                  type: "sale" as const,
                                  description: s.items
                                    .map((i: any) => i.name)
                                    .join(", "),
                                  amount: s.totalAmount,
                                  data: s,
                                })),
                              ][0];
                              if (firstObligation)
                                handleOpenPayment(firstObligation);
                            }}
                            className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider h-9 px-3"
                          >
                            Плати дълг
                          </Button>
                        )}
                        <Button
                          onClick={() => setActiveAddMemberId(m.id)}
                          variant="outline"
                          className="border-zinc-200 text-zinc-700 rounded-xl text-[10px] font-bold uppercase tracking-wider h-9 px-3"
                        >
                          Нова такса
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* OVERVIEW STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-zinc-100 p-6 rounded-4xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest2 text-zinc-400">
              Общо чакащи такси
            </p>
            <h4 className="text-3xl font-light tracking-tight text-zinc-950 mt-1">
              {formatPrice(totalDuesSum)}
            </h4>
          </div>
          <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center text-rose-500">
            <AlertTriangle className="h-5 w-5 animate-pulse" />
          </div>
        </div>

        <div className="bg-white border border-zinc-100 p-6 rounded-4xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest2 text-zinc-400">
              Активни длъжници
            </p>
            <h4 className="text-3xl font-light tracking-tight text-zinc-950 mt-1">
              {posBillingData.familyDebtors.length +
                posBillingData.individualDebtors.length}{" "}
              профила
            </h4>
          </div>
          <div className="w-12 h-12 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-center justify-center text-zinc-650">
            <Users className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* DEBTORS LIST & SECTIONS */}
      <div className="space-y-6">
        <h4 className="text-lg font-light tracking-tight text-zinc-950 border-b border-zinc-100 pb-3">
          Списък на активните задължения
        </h4>

        {posBillingData.familyDebtors.length === 0 &&
        posBillingData.individualDebtors.length === 0 ? (
          <div className="text-center py-20 bg-zinc-50/50 border border-dashed rounded-4xl border-zinc-100">
            <p className="text-sm font-light text-zinc-400">
              Няма регистрирани чакащи плащания в клуба! Всичко е платено.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Render Family Debtors */}
            {posBillingData.familyDebtors.map((familyGroup) => (
              <div
                key={`fam-card-${familyGroup.family.id}`}
                className="bg-white border border-amber-100 rounded-4xl p-6 shadow-sm shadow-amber-900/5 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400 rounded-l-4xl"></div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-zinc-100">
                  <div>
                    <h5 className="font-semibold text-lg text-zinc-950 flex items-center gap-2">
                      <Users
                        className="h-4 w-4 text-amber-500"
                        strokeWidth={1.5}
                      />
                      {familyGroup.family.name || "Семеен акаунт"}
                    </h5>
                    <p className="text-[10px] font-medium text-amber-600 uppercase tracking-wider mt-1">
                      Обединено семейно плащане за:{" "}
                      {familyGroup.members
                        .map((m: Member) => m.firstName)
                        .join(" и ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[9px] uppercase font-medium tracking-widest text-zinc-400">
                        Общ дълг
                      </p>
                      <p className="text-xl font-bold text-zinc-950">
                        {formatPrice(familyGroup.totalDue)}
                      </p>
                    </div>
                    <Button
                      onClick={() =>
                        handlePayFullDebtor(familyGroup.obligations)
                      }
                      className="bg-amber-500 hover:bg-amber-600 text-white rounded-2xl shadow-lg shadow-amber-500/20 text-xs font-semibold px-4 h-11"
                    >
                      Плати дълг
                    </Button>
                  </div>
                </div>

                {/* Family obligations list */}
                <div className="space-y-3 pl-2 sm:pl-4">
                  {familyGroup.obligations.map((o: any) => (
                    <div
                      key={`fam-obligation-${o.id}`}
                      className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50/50 border border-zinc-100/50 hover:bg-zinc-50 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                            {o.memberName}
                          </span>
                          <span className="text-xs font-medium text-zinc-900">
                            {o.description}
                          </span>
                        </div>
                        <p className="text-[9px] font-light text-zinc-400 uppercase tracking-wider mt-1">
                          Генерирано на: {o.date.toLocaleDateString("bg-BG")}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-sm text-zinc-950 pr-2">
                          {formatPrice(o.amount)}
                        </span>
                        <Button
                          onClick={() => handleOpenPayment(o)}
                          size="sm"
                          className="h-8 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 text-[10px] font-bold uppercase tracking-wider px-3"
                        >
                          Изчисти
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Render Individual Debtors */}
            {posBillingData.individualDebtors.map((indGroup) => (
              <div
                key={`ind-card-${indGroup.member.id}`}
                className="bg-white border border-rose-100 rounded-4xl p-6 shadow-sm shadow-rose-900/5 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-400 rounded-l-4xl"></div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-zinc-100">
                  <div>
                    <h5 className="font-semibold text-lg text-zinc-950">
                      {indGroup.member.firstName} {indGroup.member.lastName}
                    </h5>
                    <p className="text-[10px] font-light text-zinc-450 uppercase mt-1 tracking-wider">
                      Група: {indGroup.member.ageGroup || "Деца"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[9px] uppercase font-medium tracking-widest text-zinc-400">
                        Общ дълг
                      </p>
                      <p className="text-xl font-bold text-zinc-950">
                        {formatPrice(indGroup.totalDue)}
                      </p>
                    </div>
                    <Button
                      onClick={() => handlePayFullDebtor(indGroup.obligations)}
                      className="bg-rose-500 hover:bg-rose-600 text-white rounded-2xl shadow-lg shadow-rose-500/20 text-xs font-semibold px-4 h-11"
                    >
                      Плати дълг
                    </Button>
                  </div>
                </div>

                {/* Individual obligations list */}
                <div className="space-y-3 pl-2 sm:pl-4">
                  {indGroup.obligations.map((o: any) => (
                    <div
                      key={`ind-obligation-${o.id}`}
                      className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50/50 border border-zinc-100/50 hover:bg-zinc-50 transition-colors"
                    >
                      <div>
                        <span className="text-xs font-medium text-zinc-900">
                          {o.description}
                        </span>
                        <p className="text-[9px] font-light text-zinc-400 uppercase tracking-wider mt-1">
                          Генерирано на: {o.date.toLocaleDateString("bg-BG")}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-sm text-zinc-950 pr-2">
                          {formatPrice(o.amount)}
                        </span>
                        <Button
                          onClick={() => handleOpenPayment(o)}
                          size="sm"
                          className="h-8 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 text-[10px] font-bold uppercase tracking-wider px-3"
                        >
                          Изчисти
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
