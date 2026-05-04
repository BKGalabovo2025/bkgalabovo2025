"use client";

import { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  PlusCircle, 
  History, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  MoreHorizontal,
  Eye,
  Pencil
} from "lucide-react";
import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { Sale, Member } from "@/types";
import { getSalesByMemberId, addSale } from "@/services/sales-service";
import { getAllClubServices } from "@/services/subscription-service";
import { formatPrice } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getMemberMonthlyBillingHistory, MonthlyBillingInfo } from "@/services/sales-service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/auth-context";

interface MemberSalesHistoryProps {
  memberId: string;
  member: Member;
  familyMembers: Member[];
  showFamily?: boolean;
}

export const MemberSalesHistory = ({ memberId, member, familyMembers, showFamily }: MemberSalesHistoryProps) => {
  const router = useRouter();
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [billingHistory, setBillingHistory] = useState<MonthlyBillingInfo[]>([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [billingLoading, setBillingLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setSalesLoading(true);
        setBillingLoading(true);
        
        const memberIds = showFamily 
          ? [memberId, ...familyMembers.map(m => m.id)]
          : [memberId];

        const [salesDataResults, billingDataResults, servicesData] = await Promise.all([
          Promise.all(memberIds.map(id => getSalesByMemberId(id))),
          Promise.all(memberIds.map(id => getMemberMonthlyBillingHistory(id))),
          getAllClubServices()
        ]);

        setServices(servicesData);

        // Flatten and sort sales
        // Aggregate billing by month/year
        const billingMap = new Map<string, MonthlyBillingInfo & { memberIds: Set<string> }>();
        
        billingDataResults.forEach((billingList, index) => {
          const currentMid = memberIds[index];
          billingList.forEach(billing => {
            const key = `${billing.year}-${billing.month}`;
            const existing = billingMap.get(key);
            if (existing) {
              if (billing.attendanceCount > 0) {
                existing.attendanceCount += billing.attendanceCount;
                existing.memberIds.add(currentMid);
              }
              // FIXED: If ANY family member has paid, the family block for this month is marked as paid
              if (billing.isPaid) existing.isPaid = true;
              
              // Keep the sale object if we found one
              if (billing.sale) existing.sale = billing.sale;
            } else {
              billingMap.set(key, { 
                ...billing, 
                memberIds: new Set(billing.attendanceCount > 0 ? [currentMid] : []) 
              });
            }
          });
        });

        // De-duplicate sales by ID (just in case) and sort
        const salesMap = new Map<string, Sale>();
        salesDataResults.flat().forEach(s => {
          if (s) salesMap.set(s.id, s);
        });
        const allSales = Array.from(salesMap.values()).sort((a, b) => 
          new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
        );

        setSales(allSales);
        setBillingHistory(Array.from(billingMap.values()).sort((a, b) => 
          (b.year * 12 + b.month) - (a.year * 12 + a.month)
        ));
      } catch (err) {
        console.error("Error fetching financial data:", err);
        toast.error("Грешка при зареждане на финансовите данни");
      } finally {
        setSalesLoading(false);
        setBillingLoading(false);
      }
    };

    fetchData();
  }, [memberId, familyMembers, showFamily]);

  const handleQuickPayment = async (billing: MonthlyBillingInfo & { memberIds?: Set<string> }) => {
    if (isProcessing || !user) return;
    
    setIsProcessing(`${billing.year}-${billing.month}`);
    
    // @ts-ignore
    const activeMembersCount = billing.memberIds?.size || 1;
    
    // Find matching service from "Subscription Management" (Source of Truth)
    // We look for "Членски внос" services with matching child count in name or targetGroups
    let recommendedPrice = 50;
    let packageName = "Членски внос";
    let serviceId = "membership-fee";

    const feeServices = services.filter(s => s.name.includes("Членски внос") || s.type === "Абонамент");
    
    let matchedService;
    if (activeMembersCount === 1) {
      matchedService = feeServices.find(s => s.name.includes("1 дете") || s.price === 50);
    } else if (activeMembersCount === 2) {
      matchedService = feeServices.find(s => s.name.includes("2 деца") || s.price === 90);
    } else if (activeMembersCount >= 3) {
      matchedService = feeServices.find(s => s.name.includes("3 деца") || s.name.includes("3+ деца") || s.price === 120);
    }

    if (matchedService) {
      recommendedPrice = matchedService.price;
      packageName = matchedService.name;
      serviceId = matchedService.id;
    } else {
      // Fallback to legacy logic if no matching service found in Firestore
      if (activeMembersCount === 2) {
        recommendedPrice = 90;
        packageName = "Семеен абонамент (2 деца)";
      } else if (activeMembersCount >= 3) {
        recommendedPrice = 120;
        packageName = "Семеен абонамент (3+ деца)";
      }
    }

    try {
      // Create a sale for the membership fee
      const newSale: Omit<Sale, "id" | "createdAt" | "updatedAt"> = {
        memberId,
        items: [
          {
            productId: `fee-${billing.month}-${billing.year}`,
            name: `${packageName} (${format(new Date(billing.year, billing.month - 1), "MMMM yyyy", { locale: bg })})`,
            price: recommendedPrice,
            quantity: 1,
          }
        ],
        totalAmount: recommendedPrice,
        status: "completed",
        isPaid: true,
        saleDate: new Date().toISOString(),
        currency: "EUR",
        billingMonth: billing.month,
        billingYear: billing.year
      };

      await addSale(
        newSale as Omit<Sale, "id">,
        user.uid,
        user.displayName || user.email || "Система"
      );
      
      // Refresh data
      const memberIds = showFamily 
        ? [memberId, ...familyMembers.map(m => m.id)]
        : [memberId];

      const [salesDataResults, billingDataResults] = await Promise.all([
        Promise.all(memberIds.map(id => getSalesByMemberId(id))),
        Promise.all(memberIds.map(id => getMemberMonthlyBillingHistory(id)))
      ]);

      const allSales = salesDataResults.flat().sort((a, b) => 
        new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
      );

      const billingMap = new Map<string, MonthlyBillingInfo & { memberIds: Set<string> }>();
      billingDataResults.forEach((billingList, index) => {
        const currentMid = memberIds[index];
        billingList.forEach(b => {
          const key = `${b.year}-${b.month}`;
          const existing = billingMap.get(key);
          if (existing) {
            if (b.attendanceCount > 0) {
              existing.attendanceCount += b.attendanceCount;
              existing.memberIds.add(currentMid);
            }
            if (b.isPaid) existing.isPaid = true;
            if (b.sale) existing.sale = b.sale;
          } else {
            billingMap.set(key, { 
              ...b, 
              memberIds: new Set(b.attendanceCount > 0 ? [currentMid] : []) 
            });
          }
        });
      });

      const salesMap = new Map<string, Sale>();
      salesDataResults.flat().forEach(s => {
        if (s) salesMap.set(s.id, s);
      });
      const allSalesUpdated = Array.from(salesMap.values()).sort((a, b) => 
        new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
      );

      setSales(allSalesUpdated);
      setBillingHistory(Array.from(billingMap.values()).sort((a, b) => 
        (b.year * 12 + b.month) - (a.year * 12 + a.month)
      ));
      
      toast.success("Плащането е отразено успешно");
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("Възникна грешка при обработка на плащането");
    } finally {
      setIsProcessing(null);
    }
  };

  const getStatusDetails = (status: string, amount: number) => {
    switch (status) {
      case "completed":
        return { 
          text: "Платено", 
          variant: "default" as const, 
          icon: <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" /> 
        };
      case "pending":
        return { 
          text: "Очаква плащане", 
          variant: "secondary" as const, 
          icon: <Clock className="h-3 w-3 mr-1 text-amber-500" /> 
        };
      case "cancelled":
        return { 
          text: "Отказано", 
          variant: "destructive" as const, 
          icon: <AlertCircle className="h-3 w-3 mr-1" /> 
        };
      default:
        return { 
          text: status, 
          variant: "outline" as const, 
          icon: null 
        };
    }
  };

  const handleRowClick = (saleId: string) => {
    router.push(`/sales/${saleId}`);
  };

  const renderSalesTable = (filteredSales: Sale[]) => {
    if (filteredSales.length === 0) {
      return (
        <div className="p-12 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-[2rem] border border-dashed border-zinc-100 dark:border-zinc-800 text-zinc-400">
          Няма записи в тази категория.
        </div>
      );
    }

    return (
      <div className="border border-zinc-100 dark:border-zinc-800 rounded-[2rem] overflow-hidden shadow-sm bg-white dark:bg-zinc-900/40">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
            <TableRow className="hover:bg-transparent border-b border-zinc-100 dark:border-zinc-800">
              <TableHead className="font-black text-zinc-400 text-[10px] uppercase tracking-widest pl-8">Дата</TableHead>
              {showFamily && (
                <TableHead className="font-black text-zinc-400 text-[10px] uppercase tracking-widest">Член</TableHead>
              )}
              <TableHead className="font-black text-zinc-400 text-[10px] uppercase tracking-widest">Описание / Месец</TableHead>
              <TableHead className="font-black text-zinc-400 text-[10px] uppercase tracking-widest">Статус</TableHead>
              <TableHead className="text-right font-black text-zinc-400 text-[10px] uppercase tracking-widest">Сума</TableHead>
              <TableHead className="w-[80px] pr-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.map((sale) => {
              const statusDetails = getStatusDetails(sale.status, sale.totalAmount);
              const isMonthly = !!(sale.billingMonth && sale.billingYear);

              return (
                <TableRow
                  key={sale.id}
                  onClick={() => handleRowClick(sale.id)}
                  className="cursor-pointer hover:bg-zinc-50/80 transition-colors group border-zinc-50"
                >
                  <TableCell className="pl-8 py-4 font-bold text-zinc-600">
                    {format(new Date(sale.saleDate), "dd.MM.yyyy")}
                  </TableCell>
                  {showFamily && (
                    <TableCell>
                      <Badge variant="secondary" className="bg-zinc-100 text-zinc-500 hover:bg-zinc-100 font-bold rounded-lg px-2 py-0">
                        {sale.memberId === memberId ? "Ти" : (familyMembers.find(m => m.id === sale.memberId)?.firstName || "Член")}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {isMonthly ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 font-bold rounded-lg px-2 py-0">
                            {format(new Date(sale.billingYear!, sale.billingMonth! - 1), "MMMM", { locale: bg })}
                          </Badge>
                          <span className="text-xs text-zinc-400 font-medium">{sale.items[0]?.name.split('(')[0]}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-xs text-zinc-500 font-bold">
                            {sale.items.length > 1 
                              ? `${sale.items[0].name} + ${sale.items.length - 1} още` 
                              : sale.items[0]?.name || "Покупка"}
                          </span>
                          {sale.items.length > 1 && (
                            <span className="text-[10px] text-zinc-400">
                              {sale.items.map(i => i.name).join(", ")}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusDetails.variant} className="rounded-full px-3 text-[10px]">
                      {statusDetails.text}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-black text-zinc-900">
                    {formatPrice(sale.totalAmount)}
                  </TableCell>
                  <TableCell className="pr-8 text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-zinc-200">
                          <MoreHorizontal className="h-4 w-4 text-zinc-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl border-zinc-200 shadow-xl">
                        <DropdownMenuItem 
                          className="font-bold cursor-pointer rounded-lg m-1"
                          onSelect={() => handleRowClick(sale.id)}
                        >
                          <Eye className="mr-2 h-4 w-4 text-blue-500" />
                          <span>Преглед</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="font-bold cursor-pointer rounded-lg m-1"
                          onSelect={() => router.push(`/sales/${sale.id}/edit`)}
                        >
                          <Pencil className="mr-2 h-4 w-4 text-zinc-500" />
                          <span>Редактирай</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-12">
      {/* SECTION 1: Monthly Obligations */}
      <section className="bg-zinc-50/50 p-6 rounded-[2.5rem] border border-zinc-100">
        <div className="flex items-center gap-2 mb-6 px-2">
          <CreditCard className="h-5 w-5 text-zinc-400" />
          <h3 className="text-lg font-bold">Месечни задължения</h3>
        </div>

        {billingLoading ? (
          <p className="text-center py-10 text-zinc-400">Зареждане на задълженията...</p>
        ) : billingHistory.filter(b => !b.isPaid && b.attendanceCount > 0).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-white rounded-[2rem] border border-zinc-100 shadow-sm">
            <CheckCircle2 className="h-10 w-10 text-emerald-100 mb-2" />
            <p className="text-zinc-400 font-medium">Няма текущи задължения</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {billingHistory.filter(b => !b.isPaid && b.attendanceCount > 0).map((billing) => {
              const monthName = format(new Date(billing.year, billing.month - 1), "MMMM", { locale: bg });
              const processingId = `${billing.year}-${billing.month}`;
              
              // @ts-ignore - we added memberIds in our local aggregation
              const activeMembersCount = billing.memberIds?.size || 1;
              
              // Find matching service from "Subscription Management" (Source of Truth)
              const feeServices = services.filter(s => s.name.includes("Членски внос") || s.type === "Абонамент");
              let recommendedPrice = 50;
              let packageName = "Членски внос";
              
              let matchedService;
              if (activeMembersCount === 1) {
                matchedService = feeServices.find(s => s.name.includes("1 дете") || s.price === 50);
              } else if (activeMembersCount === 2) {
                matchedService = feeServices.find(s => s.name.includes("2 деца") || s.price === 90);
              } else if (activeMembersCount >= 3) {
                matchedService = feeServices.find(s => s.name.includes("3 деца") || s.name.includes("3+ деца") || s.price === 120);
              }

              if (matchedService) {
                recommendedPrice = matchedService.price;
                packageName = matchedService.name;
              } else {
                if (activeMembersCount === 2) {
                  recommendedPrice = 90;
                  packageName = "Семеен абонамент (2 деца)";
                } else if (activeMembersCount >= 3) {
                  recommendedPrice = 120;
                  packageName = "Семеен абонамент (3+ деца)";
                }
              }

              return (
                <div 
                  key={processingId}
                  className="bg-white p-5 rounded-[2rem] border border-zinc-100 shadow-sm flex flex-col justify-between group hover:border-blue-200 transition-colors relative overflow-hidden"
                >
                  {activeMembersCount > 1 && (
                    <div className="absolute top-0 right-0 bg-blue-500 text-white text-[8px] font-black px-2 py-1 rounded-bl-xl uppercase tracking-tighter">
                      Препоръчан пакет
                    </div>
                  )}
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 font-bold rounded-xl px-3">
                        {monthName} {billing.year}
                      </Badge>
                      <span className="text-[10px] font-black text-zinc-300 uppercase tracking-tighter">Такса</span>
                    </div>
                    <div className="space-y-1 mt-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Активни деца:</span>
                        <span className="font-bold text-zinc-900">{activeMembersCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Общо присъствия:</span>
                        <span className="font-bold text-zinc-900">{billing.attendanceCount}</span>
                      </div>
                      <div className="pt-2 mt-2 border-t border-zinc-50">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-400">Пакет:</span>
                          <span className="font-bold text-blue-600">{packageName}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-zinc-400">Сума за плащане:</span>
                          <span className="font-black text-zinc-900">{formatPrice(recommendedPrice)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full mt-5 rounded-xl font-bold bg-zinc-900 hover:bg-black text-white"
                    size="sm"
                    onClick={() => handleQuickPayment(billing)}
                    disabled={!!isProcessing}
                  >
                    {isProcessing === processingId ? "Обработка..." : "Плати сега"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: Transaction History */}
      <section>
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-zinc-400" />
            <h3 className="text-lg font-bold">История на плащанията</h3>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="rounded-full font-bold text-zinc-500 hover:text-zinc-900"
            onClick={() => router.push(`/sales/new?memberId=${memberId}`)}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Продажба от магазин
          </Button>
        </div>

        {salesLoading ? (
          <p className="text-center py-10 text-zinc-400">Зареждане на историята...</p>
        ) : sales.length === 0 ? (
          <div className="p-12 text-center bg-zinc-50 rounded-[2rem] border border-dashed border-zinc-200 text-zinc-400">
            Няма регистрирани транзакции.
          </div>
        ) : (
          renderSalesTable(sales)
        )}
      </section>
    </div>
  );
};
