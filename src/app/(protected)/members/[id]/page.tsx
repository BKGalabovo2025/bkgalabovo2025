'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getMemberById } from '@/services/member-service';
import { getSalesByMemberId, markSaleAsPaid } from '@/services/sales-service'; // Correctly import markSaleAsPaid
import { Member, Sale } from '@/types';
import { useToast } from "@/components/ui/use-toast";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Pencil, User, Phone, Mail, Home, Cake, ShoppingBag, Receipt, CheckCircle } from 'lucide-react';

const MemberDetailsPage = () => {
  const [member, setMember] = useState<Member | null>(null);
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
        // Update the state locally to reflect the change immediately
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

  const getStatusVariant = (status: Sale['status']) => {
    switch (status) {
        case 'completed':
        case 'paid':
            return 'success';
        case 'pending':
            return 'destructive';
        default:
            return 'secondary';
    }
  };

  const getStatusText = (status: Sale['status']) => {
      switch (status) {
        case 'completed':
        case 'paid':
            return 'Платено';
        case 'pending':
            return 'Неплатено';
        default:
            return status;
    }
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="items-center text-center">
                <Avatar className="h-24 w-24 mb-2">
                    <AvatarImage src={member.avatarUrl} alt={`${member.firstName} ${member.lastName}`} />
                    <AvatarFallback className="text-3xl">{member.firstName?.[0]}{member.lastName?.[0]}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-2xl">{member.firstName} {member.lastName}</CardTitle>
                 <Badge variant={member.status === 'active' ? 'success' : 'secondary'}>
                    {member.status === 'active' ? 'Активен' : 'Неактивен'}
                </Badge>
            </CardHeader>
            <CardContent className="text-sm text-gray-700 space-y-3">
                <div className="flex items-center"><User className="h-4 w-4 mr-3 text-gray-500"/> {member.middleName ? `${member.firstName} ${member.middleName} ${member.lastName}` : ''}</div>
                <div className="flex items-center"><Mail className="h-4 w-4 mr-3 text-gray-500"/> {member.email || 'Няма данни'}</div>
                <div className="flex items-center"><Phone className="h-4 w-4 mr-3 text-gray-500"/> {member.phone || 'Няма данни'}</div>
                <div className="flex items-center"><Cake className="h-4 w-4 mr-3 text-gray-500"/> {new Date(member.dateOfBirth).toLocaleDateString('bg-BG')}</div>
                <div className="flex items-center"><Home className="h-4 w-4 mr-3 text-gray-500"/> {member.address || 'Няма данни'}</div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <ShoppingBag className="h-5 w-5 mr-2"/>
                        История на покупките
                    </CardTitle>
                    <CardDescription>Списък с всички покупки на стоки от клуба.</CardDescription>
                </CardHeader>
                <CardContent>
                    {sales.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Дата</TableHead>
                                    <TableHead className="text-center">Статус</TableHead>
                                    <TableHead className="text-right">Сума</TableHead>
                                    <TableHead className="w-48 text-right">Действия</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sales.map(sale => (
                                    <TableRow key={sale.id}>
                                        <TableCell>{new Date(sale.date).toLocaleDateString('bg-BG')}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={getStatusVariant(sale.status)}>{getStatusText(sale.status)}</Badge>
                                        </TableCell>
                                        <TableCell className="font-medium text-right">{sale.total.toFixed(2)} лв.</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            {sale.status === 'pending' && (
                                                <Button variant="outline-success" size="sm" onClick={() => handleMarkAsPaid(sale.id)}>
                                                    <CheckCircle className="h-4 w-4 mr-1"/> Плати
                                                </Button>
                                            )}
                                            <Button variant="outline" size="sm" onClick={() => router.push(`/sales/${sale.id}/receipt`)}>
                                                <Receipt className="h-4 w-4"/>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-center text-muted-foreground py-4">Няма регистрирани покупки.</p>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default MemberDetailsPage;
