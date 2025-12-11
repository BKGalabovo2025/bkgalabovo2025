
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, DollarSign, ListChecks, UserPlus, Loader2 } from "lucide-react";
import Link from "next/link";
import { getDashboardStats, DashboardStats } from '@/services/dashboard-service';
import { useToast } from '@/components/ui/use-toast';

const initialStats: DashboardStats = {
    activeMembers: 0,
    monthlyRevenue: 0,
    pendingSubscriptions: 0,
    recentMembers: [],
};

const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Dashboard Error:", error);
        toast({ title: "Грешка при зареждане на статистиките", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [toast]);

  if (isLoading) {
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
             <Link href="/members/" passHref>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Добави член
                </Button>
             </Link>
        </div>
     
      {/* Секция с ключови показатели */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активни членове</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeMembers}</div>
            <Link href="/members" className="text-xs text-muted-foreground hover:underline">Към списъка с членове</Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Приходи (текущ месец)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthlyRevenue.toFixed(2)} лв.</div>
             <Link href="/finances/payments" className="text-xs text-muted-foreground hover:underline">Към история на плащанията</Link>
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

      {/* Секция с последно регистрирани членове */}
       <div className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Последно регистрирани</CardTitle>
                    <CardDescription>Списък на последните няколко регистрирани членове.</CardDescription>
                </CardHeader>
                <CardContent>
                     {stats.recentMembers.length > 0 ? (
                        <div className="space-y-4">
                            {stats.recentMembers.map(member => (
                                <div key={member.id} className="flex items-center">
                                    <div className="ml-4 space-y-1">
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
