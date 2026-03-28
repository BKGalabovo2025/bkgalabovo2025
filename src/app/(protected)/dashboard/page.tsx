'use client';

import { useDashboardData } from '@/hooks/useDashboardData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, Users, BarChart, TrendingUp, TrendingDown, Package, CreditCard } from 'lucide-react';
import { formatPrice } from '@/lib/currency';
import { RemindersCard } from '@/components/reminders/reminders-card';
import { AssistantPanel } from '@/components/dashboard/assistant-panel';
import { Sale } from '@/types';
import { format } from 'date-fns';

const DashboardPage = () => {
  const { stats, allMembers, recentSales, reminders, loading, error } = useDashboardData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Зареждане на таблото...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-destructive">
        <AlertCircle className="h-12 w-12 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Грешка при зареждане на таблото</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!stats || !allMembers || !recentSales || !reminders) {
    return null; 
  }

  const getSaleDetails = (sale: Sale) => {
    const firstItem = sale.items?.[0];
    const isSubscription = !!sale.subscriptionId;

    if (!firstItem) {
        return { type: 'fee' as const, description: 'Корекция на салдо' };
    }
    
    return {
        type: isSubscription ? 'fee' as const : 'inventory' as const,
        description: firstItem.name || 'Неизвестна продажба'
    };
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-bold font-heading">Табло за управление</h1>
        <p className="text-muted-foreground">Бърз преглед на активността в клуба.</p>
      </header>

      <AssistantPanel />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Приходи (30 дни)" value={formatPrice(stats.revenueLast30Days || 0)} icon={<TrendingUp />} change={stats.revenueChange}/>
        <StatCard title="Активни членове" value={stats.activeMembersCount.toString()} icon={<Users />} />
        <StatCard title="Нови членове (30 дни)" value={stats.newMembersLast30Days.toString()} icon={<Users />} change={stats.newMembersChange} />
        <StatCard title="Продажби (30 дни)" value={(stats.salesLast30Days || 0).toString()} icon={<BarChart />} change={stats.salesChange} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Последни продажби</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            {recentSales.length > 0 ? recentSales.map(sale => {
              const member = sale.memberId ? allMembers.find(m => m.id === sale.memberId) : null;
              const memberName = member ? `${member.firstName} ${member.lastName}`.trim() : 'Продажба в брой';
              const saleDetails = getSaleDetails(sale);

              return (
                <div key={sale.id} className="flex items-center gap-4">
                  <div className="h-10 w-10 flex items-center justify-center bg-secondary rounded-full">
                      {saleDetails.type === 'inventory' ? 
                          <Package className="h-5 w-5 text-muted-foreground" /> : 
                          <CreditCard className="h-5 w-5 text-muted-foreground" />
                      }
                  </div>
                  <div className="grid gap-1 grow">
                    <p className="text-sm font-medium leading-none">{memberName}</p>
                    <p className="text-sm text-muted-foreground">{saleDetails.description}</p>
                  </div>
                  <div className="ml-auto font-medium text-right">
                      <div>{formatPrice(sale.totalAmount)}</div>
                      <div className="text-xs text-muted-foreground font-normal">{format(new Date(sale.saleDate), 'dd.MM.yyyy')}</div>
                  </div>
                </div>
              );
            }) : (
              <p className="text-sm text-center text-muted-foreground py-4">Няма скорошни продажби.</p>
            )}
          </CardContent>
        </Card>
        
        <RemindersCard reminders={reminders} />
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, change }: { title: string, value: string, icon: React.ReactNode, change?: number }) => {
    const changeColor = change && change > 0 ? 'text-green-500' : change && change < 0 ? 'text-red-500' : 'text-muted-foreground';
    const changeIcon = change && change > 0 ? <TrendingUp className="h-4 w-4"/> : change && change < 0 ? <TrendingDown className="h-4 w-4"/> : null;
  
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {change !== undefined && (
              <p className={`text-xs ${changeColor} flex items-center`}>
                  {changeIcon}
                  {change.toFixed(2)}% спрямо предходния период
              </p>
          )}
        </CardContent>
      </Card>
    );
  }

export default DashboardPage;
