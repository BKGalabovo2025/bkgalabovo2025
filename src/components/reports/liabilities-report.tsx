
'use client';

import { useState, useEffect } from 'react';
import { Member, MemberSubscription, ClubService } from '@/types';
import { getAllSubscriptions } from '@/services/finance-service';
import { getAllMembers } from '@/services/member-service';
import { getAllClubServices } from '@/services/subscription-service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface Liability {
  member: Member;
  subscription: MemberSubscription;
  service?: ClubService;
}

const LiabilitiesReport = () => {
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLiabilities = async () => {
      setIsLoading(true);
      try {
        const [allSubscriptions, allMembers, allServices] = await Promise.all([
          getAllSubscriptions(),
          getAllMembers(),
          getAllClubServices(),
        ]);
        
        const unpaidSubscriptions = allSubscriptions.filter(
          (sub) => sub.status === 'pending_payment'
        );

        const memberMap = new Map(allMembers.map((m) => [m.id, m]));
        const serviceMap = new Map(allServices.map((s) => [s.id, s]));

        const combinedLiabilities = unpaidSubscriptions.map((sub) => ({
          subscription: sub,
          member: memberMap.get(sub.memberId)!,
          service: serviceMap.get(sub.serviceId),
        })).filter(item => item.member && item.service); // Ensure both member and service exist

        setLiabilities(combinedLiabilities);
      } catch (error) {
        console.error("Failed to fetch liabilities:", error);
        // Handle error display in UI
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiabilities();
  }, []);

  if (isLoading) {
    return <div className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Зареждане на справката...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Справка задължения</CardTitle>
      </CardHeader>
      <CardContent>
        {liabilities.length === 0 ? (
          <p>Няма намерени задължения.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Име на член</TableHead>
                <TableHead>Тип абонамент</TableHead>
                <TableHead>Краен срок</TableHead>
                <TableHead className="text-right">Дължима сума</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {liabilities.map(({ member, subscription, service }) => (
                <TableRow key={subscription.id}>
                  <TableCell>{`${member.firstName} ${member.lastName}`}</TableCell>
                  <TableCell>{service?.name || 'Няма име'}</TableCell>
                  <TableCell>{new Date(subscription.endDate).toLocaleDateString('bg-BG')}</TableCell>
                  <TableCell className="text-right font-medium">{(subscription.pricePaid / 100).toFixed(2)} {subscription.currency}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default LiabilitiesReport;
