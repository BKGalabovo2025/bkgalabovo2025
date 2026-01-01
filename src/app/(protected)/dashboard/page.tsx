'use client';

import { useRouter } from 'next/navigation';
import { useDashboardData, DashboardStats } from '@/hooks/useDashboardData';
import { Member, Sale } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, AlertCircle, Users, BarChart, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

const DashboardPage = () => {
  const { stats, allMembers, recentSales, loading, error } = useDashboardData(); // Use allMembers
  const router = useRouter();

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
        <h2 className="text-xl font-semibold mb-2">Грешка при зареждане</h2>
        <p>{error}</p>
      </div>
    );
  }
  
  // Sort members by registration date and take the most recent ones for the 'RecentMembersCard'
  const recentMembers = allMembers
    .sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime())
    .slice(0, 5);

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-6">Табло за управление</h1>
      
      {stats && <StatsCards stats={stats} />}

      <div className="grid gap-6 mt-6 md:grid-cols-2 lg:grid-cols-3">
        <RecentMembersCard members={recentMembers} onNavigate={(id) => router.push(`/members/${id}`)} getInitials={getInitials} />
        <RecentSalesCard sales={recentSales} members={allMembers} onNavigate={(id) => router.push(`/sales/${id}`)} />
      </div>
    </div>
  );
};

const StatsCards = ({ stats }: { stats: DashboardStats }) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Общо членове</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stats.totalMembers}</div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Активни членове</CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stats.activeMembers}</div>
      </CardContent>
    </Card>
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общо приходи (EUR)</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
             <div className="text-2xl font-bold">
                {formatCurrency(stats.totalRevenue.EUR || 0)}
            </div>
        </CardContent>
    </Card>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Неплатени сметки</CardTitle>
        <TrendingDown className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stats.unpaidSales}</div>
      </CardContent>
    </Card>
  </div>
);

const RecentMembersCard = ({ members, onNavigate, getInitials }: { members: Member[], onNavigate: (id: string) => void, getInitials: (f?: string, l?: string) => string }) => (
  <Card className="lg:col-span-2">
    <CardHeader>
      <CardTitle>Последни регистрирани членове</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {!Array.isArray(members) || members.length === 0 ? (
            <p className="text-sm text-muted-foreground">Няма намерени членове.</p>
        ) : (members.map((member, index) => {
            if (!member || typeof member !== 'object') return null;
            return (
              <div key={member.id || index} className="flex items-center space-x-4 cursor-pointer hover:bg-muted/50 p-2 rounded-lg" onClick={() => member.id && onNavigate(member.id)}>
                <Avatar className="h-9 w-9">
                  <AvatarImage src={member.avatarUrl ?? undefined} alt="Avatar" />
                  <AvatarFallback>{getInitials(member.firstName, member.lastName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium leading-none">{member.firstName || ''} {member.lastName || ''}</p>
                  <p className="text-sm text-muted-foreground break-all">{member.email || 'Няма имейл'}</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {member.registrationDate ? new Date(member.registrationDate).toLocaleDateString('bg-BG') : 'N/A'}
                </div>
              </div>
            );
        }))}
      </div>
    </CardContent>
  </Card>
);

const RecentSalesCard = ({ sales, members, onNavigate }: { sales: Sale[], members: Member[], onNavigate: (id: string) => void }) => (
  <Card>
    <CardHeader>
      <CardTitle>Последни продажби</CardTitle>
    </CardHeader>
    <CardContent>
        <div className="space-y-4">
            {!Array.isArray(sales) || sales.length === 0 ? (
                <p className="text-sm text-muted-foreground">Няма скорошни продажби.</p>
            ) : (sales.map((sale, index) => {
                if (!sale || typeof sale !== 'object') return null;
                const member = members.find(m => m.id === sale.memberId);
                const memberName = member ? `${member.firstName} ${member.lastName}` : 'Външен клиент';
                return (
                  <div key={sale.id || index} className="flex items-center space-x-4 cursor-pointer hover:bg-muted/50 p-2 rounded-lg" onClick={() => sale.id && onNavigate(sale.id)}>
                      <div className="flex-1">
                          <p className="text-sm font-medium leading-none">{memberName}</p>
                          <p className="text-sm text-muted-foreground">{sale.saleDate ? new Date(sale.saleDate).toLocaleDateString('bg-BG') : 'Няма дата'}</p>
                      </div>
                      <div className="text-sm font-semibold">{formatCurrency(sale.total)}</div>
                  </div>
                );
            }))}
        </div>
    </CardContent>
  </Card>
);

export default DashboardPage;
