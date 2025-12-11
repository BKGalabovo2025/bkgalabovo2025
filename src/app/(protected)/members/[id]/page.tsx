
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Member } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, ArrowLeft, Mail, Phone, Home, Cake, Info, User, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { SalesHistory } from '@/components/sales/sales-history'; // Импортираме новия компонент

const MemberDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchMember = async () => {
      try {
        const docRef = doc(db, 'members', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          // ВАЖНО: Тук допускаме, че тези полета съществуват, за да избегнем грешки
          const data = docSnap.data();
          const memberData: Member = {
              id: docSnap.id,
              name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Няма име',
              email: data.email,
              phone: data.phone,
              joinDate: data.registrationDate ? new Date(data.registrationDate).toISOString() : new Date().toISOString(),
              isActive: data.status === 'active',
          };
          setMember(memberData);
        } else {
          toast({ title: "Грешка", description: "Член с такова ID не е намерен.", variant: "destructive" });
          router.push('/members');
        }
      } catch (error) {
        console.error("Firebase Error: ", error);
        toast({ title: "Грешка при зареждане", description: "Възникна проблем при извличането на данните.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMember();
  }, [id, router, toast]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!member) {
    return null; // Ще бъде пренасочен от useEffect
  }

  return (
    <div className="p-4 sm:p-6">
        <Button variant="outline" onClick={() => router.push('/members')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Всички членове
        </Button>

        <Card>
            <CardHeader className="flex flex-col items-center text-center">
                <Avatar className="w-24 h-24 mb-4 border-2 border-primary">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`} alt="Avatar" />
                    <AvatarFallback className="text-3xl">{getInitials(member.name)}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-3xl">{member.name}</CardTitle>
                 <span className={`mt-2 px-3 py-1 text-sm font-semibold rounded-full ${member.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {member.isActive ? 'Активен' : 'Неактивен'}
                  </span>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center text-muted-foreground">
                    <Mail className="mr-3 h-5 w-5" />
                    {member.email ? <a href={`mailto:${member.email}`} className="text-primary hover:underline">{member.email}</a> : <span>Няма имейл</span>}
                </div>
                <div className="flex items-center text-muted-foreground">
                    <Phone className="mr-3 h-5 w-5" />
                    <span>{member.phone || 'Няма телефон'}</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                    <CalendarIcon className="mr-3 h-5 w-5" />
                    <span>Регистриран на: {new Date(member.joinDate).toLocaleDateString('bg-BG')}</span>
                </div>
            </CardContent>
        </Card>

        {/* Добавяме историята на покупките тук */}
        <SalesHistory memberId={id} />

    </div>
  );
};

export default MemberDetailsPage;
