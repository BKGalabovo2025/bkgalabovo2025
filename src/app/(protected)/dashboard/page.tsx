
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CreditCard, ListChecks, AlertTriangle, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getDashboardStats } from '@/services/dashboard-service';
import { useToast } from '@/components/ui/use-toast';
import { DashboardStats, Sale, Member } from '@/types';

// Define the initial state with the full structure of DashboardStats
const initialStats: DashboardStats = {
    activeMembers: 0,
    monthlyRevenue: 0,
    pendingSubscriptions: 0,
    recentMembers: [],
    deferredExternalSales: [],
    deferredMemberSales: [],
};

const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user === undefined) return; // Wait until auth state is resolved
    if (!user) {
      router.replace('/login');
      return;
    }

    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        toast({ title: "Грешка при зареждане на статистиките", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user, router, toast]);

  if (isLoading || user === undefined) {
    return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6">
             <h1 className="text-3xl font-bold">Табло за управление</h1>
        </div>
     
      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активни членове</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeMembers}</div>
            <Link href="/members" className="text-xs text-muted-foreground hover:underline">Към членовете</Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Приходи (текущ месец)</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthlyRevenue.toFixed(2)} EUR</div>
             <Link href="/finances" className="text-xs text-muted-foreground hover:underline">Към финансите</Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Чакащи абонаменти</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.pendingSubscriptions}</div>
             <Link href="/finances/subscriptions" className="text-xs text-muted-foreground hover:underline">Към абонаментите</Link>
          </CardContent>
        </Card>
      </div>

      {/* Deferred Sales Section */}
       <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
            {stats.deferredMemberSales?.length > 0 && (
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle />Неплатени задължения (Членове)</CardTitle>
                        <CardDescription>Списък на членове с една или повече неплатени продажби.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.deferredMemberSales.map((sale: Sale) => (
                                <div key={sale.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                    <div>
                                        <Link href={`/members/${sale.memberId}`} className="font-semibold text-primary hover:underline">{sale.customerName}</Link>
                                        <p className="text-sm text-muted-foreground">
                                            От {new Date(sale.date).toLocaleDateString('bg-BG')} - <span className="font-bold">{sale.total.toFixed(2)} EUR</span>
                                        </p>
                                    </div>
                                    <Link href={`/sales/${sale.id}`} passHref>
                                        <Button variant="secondary" size="sm">
                                            Към продажбата <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {stats.deferredExternalSales?.length > 0 && (
                <Card className="border-orange-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-600"><AlertTriangle/>Отложени плащания (Външни)</CardTitle>
                        <CardDescription>Това са неплатени продажби от клиенти, които не са членове.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.deferredExternalSales.map((sale: Sale) => (
                                <div key={sale.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                    <div>
                                    <div className="font-semibold">{sale.customerName}</div>
                                    <p className="text-sm text-muted-foreground">
                                        От {new Date(sale.date).toLocaleDateString('bg-BG')} - <span className="font-bold">{sale.total.toFixed(2)} EUR</span>
                                    </p>
                                    </div>
                                    <Link href={`/sales/${sale.id}`} passHref>
                                        <Button variant="secondary" size="sm">
                                            Към продажбата <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
      </div>

      {/* Recent Members Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
            <CardHeader>
                <CardTitle>Последно регистрирани</CardTitle>
                <CardDescription>Списък на последните няколко регистрирани членове.</CardDescription>
            </CardHeader>
            <CardContent>
                  {stats.recentMembers?.length > 0 ? (
                    <div className="space-y-4">
                        {stats.recentMembers.map((member) => (
                            <div key={member.id} className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Link href={`/members/${member.id}`} className="text-sm font-medium leading-none text-primary hover:underline">
                                        {`${member.firstName} ${member.lastName}`}
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Няма наскоро регистрирани членове.</p>
                  )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
