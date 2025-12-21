'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAllMembers, getMemberById } from '@/services/member-service'; // Import getAllMembers
import { getSalesByMemberId, markSaleAsPaid } from '@/services/sales-service';
import { Member, Sale } from '@/types';
import { useToast } from "@/components/ui/use-toast";

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, Pencil } from 'lucide-react';
import { MemberDetailsCard } from '@/components/members/member-details-card';
import { MemberSalesHistory } from '@/components/members/member-sales-history';

const MemberDetailsPage = () => {
  const [member, setMember] = useState<Member | null>(null);
  const [familyMembers, setFamilyMembers] = useState<Member[]>([]);
  const [sales, setSales] = useState<Sale[]>([]); 
  const [loading, setLoading] = useState(true);
  
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const memberId = params.id as string;

  useEffect(() => {
    if (memberId) {
      const fetchMemberData = async () => {
        setLoading(true);
        try {
          const memberData = await getMemberById(memberId);
          setMember(memberData);

          if (memberData && memberData.familyId) {
            const allMembers = await getAllMembers();
            const relatedMembers = allMembers.filter(m => m.familyId === memberData.familyId && m.id !== memberData.id);
            setFamilyMembers(relatedMembers);
          }

          const salesData = await getSalesByMemberId(memberId);
          setSales(salesData);

        } catch (error) {
          console.error("Грешка при зареждане на данните за члена:", error);
          toast({ title: "Грешка", description: "Неуспешно зареждане на данните.", variant: "destructive" });
        } finally {
          setLoading(false);
        }
      };
      fetchMemberData();
    }
  }, [memberId, toast]);

  const handleMarkAsPaid = async (saleId: string) => {
    try {
        await markSaleAsPaid(saleId);
        setSales(prevSales => 
            prevSales.map(sale => 
                sale.id === saleId ? { ...sale, status: 'completed' } : sale
            )
        );
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
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="personal-info">Лична информация</TabsTrigger>
            <TabsTrigger value="financial-history">Финансова история</TabsTrigger>
        </TabsList>
        <TabsContent value="personal-info" className="mt-6">
            <MemberDetailsCard member={member} familyMembers={familyMembers} />
        </TabsContent>
        <TabsContent value="financial-history" className="mt-6">
            <MemberSalesHistory sales={sales} onMarkAsPaid={handleMarkAsPaid} />
            {/* Future subscriptions component will go here */}
        </TabsContent>
    </Tabs>

    </div>
  );
};

export default MemberDetailsPage;
