'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '@/components/shared/data-table';
import { columns, SubscriptionData } from '@/components/finance/subscriptions/columns';
import { Subscription, ClubService, Member } from '@/types';
import { getAllClubServices, getSubscriptionsByMemberId } from '@/services/subscription-service';
import { getAllMembers } from '@/services/member-service';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';

const SubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [services, members] = await Promise.all([
        getAllClubServices(),
        getAllMembers(),
      ]);

      const allSubscriptions: Subscription[] = [];
      for (const member of members) {
        const memberSubscriptions = await getSubscriptionsByMemberId(member.id);
        allSubscriptions.push(...memberSubscriptions);
      }

      const enrichedSubscriptions: SubscriptionData[] = allSubscriptions.map((sub: Subscription) => {
        const service = services.find((s: ClubService) => s.id === sub.serviceId);
        const member = members.find((m: Member) => m.id === sub.memberId);
        return {
          ...sub,
          serviceName: service?.name || 'Unknown Service',
          memberFirstName: member?.firstName || 'Unknown',
          memberLastName: member?.lastName || 'Member',
        };
      });

      setSubscriptions(enrichedSubscriptions);
    } catch (error) {
      console.error("Error fetching subscription data:", error);
      toast({
        title: 'Грешка при зареждане на данните',
        description: 'Възникна проблем при извличането на абонаментите.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-4 sm:p-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Управление на абонаменти</CardTitle>
                    <CardDescription>Преглед на всички абонаменти на членове.</CardDescription>
                </div>
                 <Link href="/finances/services/new">
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Добави абонамент
                    </Button>
                </Link>
            </CardHeader>
            <CardContent>
                 <DataTable 
                    columns={columns} 
                    data={subscriptions} 
                    isLoading={isLoading}
                    filterColumnId='memberLastName'
                    filterPlaceholder='Филтриране по фамилия...'
                    emptyStateMessage="Все още няма добавени абонаменти."
                 />
            </CardContent>
        </Card>
    </div>
  );
};

export default SubscriptionsPage;
