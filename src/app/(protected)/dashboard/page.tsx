
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, DollarSign, ListChecks, UserPlus, Loader2, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getDashboardStats, DashboardStats } from '@/services/dashboard-service';
import { useToast } from '@/components/ui/use-toast';
import { Sale, Member } from '@/types';

const initialStats: DashboardStats = {
    activeMembers: 0,
    monthlyRevenue: 0,
    pendingSubscriptions: 0,
    recentMembers: [],
    deferredExternalSales: [],
};

const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user === undefined) return;
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
        console.error("Грешка в таблото за управление:", error);
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
             <Link href="/sales/new" passHref>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Нова продажба
                </Button>
             </Link>
        </div>
     
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
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthlyRevenue.toFixed(2)} лв.</div>
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

      {stats.deferredExternalSales.length > 0 && (
        <div className="mt-6">
            <Card className="border-amber-500">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><AlertTriangle className="text-amber-500"/>Отложени плащания (Външни)</CardTitle>
                    <CardDescription>Това са неплатени продажби от клиенти, които не са членове.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {stats.deferredExternalSales.map((sale: Sale) => (
                            <div key={sale.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                                <div>
                                  <p className="font-semibold">{sale.customerName}</p>
                                  <p className="text-sm text-muted-foreground">
                                      {new Date(sale.date).toLocaleDateString('bg-BG')} - <span className="font-bold">{sale.total.toFixed(2)} лв.</span>
                                  </p>
                                </div>
                                <Link href={`/sales/${sale.id}`} passHref>
                                    <Button variant="outline" size="sm">
                                        Преглед <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
            <CardHeader>
                <CardTitle>Последно регистрирани</CardTitle>
                <CardDescription>Списък на последните няколко регистрирани членове.</CardDescription>
            </CardHeader>
            <CardContent>
                  {stats.recentMembers.length > 0 ? (
                    <div className="space-y-4">
                        {stats.recentMembers.map((member: Member) => (
                            <div key={member.id} className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Link href={`/members/${member.id}`} className="text-sm font-medium leading-none text-primary hover:underline">
                                        {`${member.firstName} ${member.lastName}`}
                                    </Link>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {member.createdAt ? new Date(member.createdAt).toLocaleDateString('bg-BG') : ''}
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
