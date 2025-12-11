
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
          setMember({ id: docSnap.id, ...docSnap.data() } as Member);
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

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
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
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.firstName} ${member.lastName}`} alt="Avatar" />
                    <AvatarFallback className="text-3xl">{getInitials(member.firstName, member.lastName)}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-3xl">{member.firstName} {member.lastName}</CardTitle>
                 <span className={`mt-2 px-3 py-1 text-sm font-semibold rounded-full ${member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {member.status === 'active' ? 'Активен' : 'Неактивен'}
                  </span>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center text-muted-foreground">
                    <Mail className="mr-3 h-5 w-5" />
                    <a href={`mailto:${member.email}`} className="text-primary hover:underline">{member.email}</a>
                </div>
                <div className="flex items-center text-muted-foreground">
                    <Phone className="mr-3 h-5 w-5" />
                    <span>{member.phone}</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                    <Home className="mr-3 h-5 w-5" />
                    <span>{member.address}</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                    <Cake className="mr-3 h-5 w-5" />
                    <span>{new Date(member.dateOfBirth).toLocaleDateString('bg-BG')}</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                    <CalendarIcon className="mr-3 h-5 w-5" />
                    <span>Регистриран на: {new Date(member.registrationDate).toLocaleDateString('bg-BG')}</span>
                </div>
                {member.notes && (
                     <div className="flex items-start text-muted-foreground md:col-span-2">
                        <Info className="mr-3 h-5 w-5 mt-1" />
                        <p className="flex-1"><b>Бележки:</b> {member.notes}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
};

export default MemberDetailsPage;
