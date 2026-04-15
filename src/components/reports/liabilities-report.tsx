"use client";

import { useState, useEffect } from "react";
import { Member, Subscription, ClubService } from "@/types";
import {
  getAllMemberSubscriptions,
  getAllClubServices,
} from "@/services/subscription-service";
import { getAllMembers } from "@/services/member-service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/lib/export-utils";

interface Liability {
  member: Member;
  subscription: Subscription;
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
          getAllMemberSubscriptions(), // FIX: was reading from wrong 'subscriptions' collection
          getAllMembers(),
          getAllClubServices(),
        ]);

        const unpaidSubscriptions = allSubscriptions.filter(
          (sub: Subscription) => sub.status === "pending_payment"
        );

        const memberMap = new Map(allMembers.map((m: Member) => [m.id, m]));
        const serviceMap = new Map(
          allServices.map((s: ClubService) => [s.id, s])
        );

        const combinedLiabilities = unpaidSubscriptions
          .map((sub: Subscription) => ({
            subscription: sub,
            member: memberMap.get(sub.memberId)!,
            service: serviceMap.get(sub.serviceId),
          }))
          .filter(
            (item: {
              member: Member | undefined;
              service: ClubService | undefined;
            }) => item.member && item.service
          ) as Liability[];

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
    return (
      <div className="flex items-center">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Зареждане на
        справката...
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Справка задължения</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const data = liabilities.map(({ member, subscription, service }) => ({
              Член: `${member.firstName} ${member.lastName}`,
              Тип: service?.name || "Н/А",
              "Краен срок": new Date(subscription.endDate).toLocaleDateString("bg-BG"),
              "Сума": `${subscription.pricePaid.toFixed(2)} ${subscription.currency}`,
            }));
            exportToCSV(data, "Справка-задължения.csv");
          }}
          disabled={liabilities.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          Експорт (CSV)
        </Button>
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
                  <TableCell>{service?.name || "Няма име"}</TableCell>
                  <TableCell>
                    {new Date(subscription.endDate).toLocaleDateString("bg-BG")}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {subscription.pricePaid.toFixed(2)} {subscription.currency}
                  </TableCell>
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
