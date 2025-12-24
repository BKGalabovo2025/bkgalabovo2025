
'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAllMembers, getMemberById, updateMember } from '@/services/member-service'; // Added updateMember
import { getSalesByMemberId, markSaleAsPaid } from '@/services/sales-service';
import { analyzeMemberStatus } from '@/services/analyzer-service';
import { Member, Sale, MemberAnalysis } from '@/types';
import { useToast } from "@/components/ui/use-toast";

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, Pencil } from 'lucide-react';
import { MemberDetailsCard } from '@/components/members/member-details-card';
import { MemberSalesHistory } from '@/components/members/member-sales-history';
import { MemberAttendanceHistory } from '@/components/members/MemberAttendanceHistory';
import { MemberSubscriptionsTab } from '@/components/members/member-subscriptions-tab';
import { MemberAnalysisCard } from '@/components/members/MemberAnalysisCard';
import { getAllClubServices } from '@/lib/actions/services';
import { getSubscriptionsByMemberId } from '@/services/subscription-service';
import { getEventsByMemberId } from '@/services/schedule-service';

const MemberDetailsPage = () => {
  const [member, setMember] = useState<Member | null>(null);
  const [familyMembers, setFamilyMembers] = useState<Member[]>([]);
  const [sales, setSales] = useState<Sale[]>([]); 
  const [analysis, setAnalysis] = useState<MemberAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const memberId = params.id as string;

  const fetchMemberData = useCallback(async () => {
    setLoading(true);
    try {
      const memberData = await getMemberById(memberId);
      setMember(memberData);

      if (memberData) {
        // --- START CACHING LOGIC ---
        const cache = memberData.analysisCache;
        const isCacheValid = cache && (new Date().getTime() - new Date(cache.generatedAt).getTime()) < 24 * 60 * 60 * 1000; // 24 hours validity

        if (isCacheValid) {
            setAnalysis(cache.result);
            console.log("Analysis loaded from CACHE.");
        } else {
            console.log("Cache invalid or missing. Performing new analysis.");
            const [allServices, memberSubscriptions, memberAttendances] = await Promise.all([
              getAllClubServices(),
              getSubscriptionsByMemberId(memberId),
              getEventsByMemberId(memberId)
            ]);
    
            const analysisData = await analyzeMemberStatus(memberData, allServices, memberSubscriptions, memberAttendances);
            setAnalysis(analysisData);

            // Asynchronously update the cache in the background
            updateMember(memberId, {
                analysisCache: {
                    generatedAt: new Date().toISOString(),
                    result: analysisData
                }
            }).catch(e => console.error("Failed to update analysis cache:", e));
        }
        // --- END CACHING LOGIC ---

        // Fetch other data that is not part of the analysis
        if (memberData.familyId) {
            const allMembers = await getAllMembers();
            const relatedMembers = allMembers.filter(m => m.familyId === memberData.familyId && m.id !== memberData.id);
            setFamilyMembers(relatedMembers);
        }

        const salesData = await getSalesByMemberId(memberId);
        setSales(salesData);
      }

    } catch (error) {
      console.error("Грешка при зареждане на данните за члена:", error);
      toast({ title: "Грешка", description: "Неуспешно зареждане на данните.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [memberId, toast]);

  useEffect(() => {
    if (memberId) {
      fetchMemberData();
    }
  }, [memberId, fetchMemberData]);

  const handleMarkAsPaid = async (saleId: string) => {
    try {
        await markSaleAsPaid(saleId);
        const updatedSalesData = await getSalesByMemberId(memberId);
        setSales(updatedSalesData);
        toast({ title: "Успех!", description: "Продажбата беше маркирана като платена." });
    } catch (error) {
        console.error("Грешка при маркиране като платено:", error);
        toast({ title: "Грешка", description: "Възникна проблем при обновяването на продажбата.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Зареждане на досие...</p>
      </div>
    );
  }

  if (!member) {
    return <div className="text-center py-10">Досието на члена не е намерено.</div>;
  }

  return (
    <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Обратно към членове
            </Button>
            <Button onClick={() => router.push(`/members/edit/${memberId}`)}>
                <Pencil className="mr-2 h-4 w-4" /> Редактирай
            </Button>
      </div>

      <Tabs defaultValue="personal-info" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="personal-info">Лична информация</TabsTrigger>
            <TabsTrigger value="subscriptions">Абонаменти</TabsTrigger>
            <TabsTrigger value="financial-history">Финансова история</TabsTrigger>
            <TabsTrigger value="attendance-history">История на присъствията</TabsTrigger>
            <TabsTrigger value="analysis">Анализ</TabsTrigger>
        </TabsList>
        <TabsContent value="personal-info" className="mt-6">
            <MemberDetailsCard member={member} familyMembers={familyMembers} />
        </TabsContent>
        <TabsContent value="subscriptions" className="mt-6">
            <MemberSubscriptionsTab memberId={memberId} />
        </TabsContent>
        <TabsContent value="financial-history" className="mt-6">
            <MemberSalesHistory sales={sales} onMarkAsPaid={handleMarkAsPaid} />
        </TabsContent>
         <TabsContent value="attendance-history" className="mt-6">
            <MemberAttendanceHistory memberId={memberId} />
        </TabsContent>
        <TabsContent value="analysis" className="mt-6">
            {analysis ? (
                <MemberAnalysisCard analysis={analysis} />
            ) : (
                <p>Анализът се зарежда или все още няма данни.</p>
            )}
        </TabsContent>
    </Tabs>

    </div>
  );
};

export default MemberDetailsPage;
