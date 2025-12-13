
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Member } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, ArrowLeft, Mail, Phone, Home, Cake, Info, User, Calendar as CalendarIcon, Edit, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { SalesHistory } from '@/components/sales/sales-history';
import { Textarea } from '@/components/ui/textarea';
import { getAgeGroup } from '@/lib/utils';

const MemberDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [currentNotes, setCurrentNotes] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchMember = async () => {
      try {
        const docRef = doc(db, 'members', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const memberData: Member = {
            id: docSnap.id,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            middleName: data.middleName || '',
            email: data.email || '',
            phone: data.phone || '',
            phoneType: data.phoneType || 'personal',
            registrationDate: data.registrationDate || new Date().toISOString(),
            dateOfBirth: data.dateOfBirth || '',
            address: data.address || '',
            status: data.status || 'inactive',
            educationInstitution: data.educationInstitution || '',
            notes: data.notes || '',
            personalId: data.personalId || '',
          };
          setMember(memberData);
          setCurrentNotes(memberData.notes || '');
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

  const handleSaveNotes = async () => {
    if (!id) return;
    try {
      const memberRef = doc(db, 'members', id);
      await updateDoc(memberRef, {
        notes: currentNotes
      });
      setMember(prevMember => prevMember ? { ...prevMember, notes: currentNotes } : null);
      setIsEditingNotes(false);
      toast({ title: "Успех", description: "Бележките бяха успешно запазени." });
    } catch (error) {
      console.error("Error updating notes: ", error);
      toast({ title: "Грешка", description: "Неуспешно запазване на бележките.", variant: "destructive" });
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    const firstInitial = firstName ? firstName[0] : '';
    const lastInitial = lastName ? lastName[0] : '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!member) {
    return null; 
  }
  
  const fullName = `${member.firstName} ${member.lastName}`.trim();
  const ageGroup = getAgeGroup(member.dateOfBirth);

  return (
    <div className="p-4 sm:p-6">
        <Button variant="outline" onClick={() => router.push('/members')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Всички членове
        </Button>

        <Card>
            <CardHeader className="flex flex-col items-center text-center">
                <Avatar className="w-24 h-24 mb-4 border-2 border-primary">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${fullName}`} alt="Avatar" />
                    <AvatarFallback className="text-3xl">{getInitials(member.firstName, member.lastName)}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-3xl">{fullName}</CardTitle>
                <div className="flex items-center gap-4 mt-2">
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {member.status === 'active' ? 'Активен' : 'Неактивен'}
                  </span>
                  {ageGroup !== 'Н/Д' && (
                     <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                        {ageGroup}
                      </span>
                  )}
                </div>
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
                    <span>Регистриран на: {new Date(member.registrationDate).toLocaleDateString('bg-BG')}</span>
                </div>
                 <div className="flex items-center text-muted-foreground">
                    <Cake className="mr-3 h-5 w-5" />
                    <span>Дата на раждане: {member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString('bg-BG') : 'Няма'}
                    </span>
                </div>
                <div className="flex items-center text-muted-foreground">
                    <Home className="mr-3 h-5 w-5" />
                    <span>{member.address || 'Няма адрес'}</span>
                </div>
            </CardContent>
        </Card>

        <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center"><Info className="mr-2 h-5 w-5"/> Бележки</CardTitle>
                {!isEditingNotes ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditingNotes(true)}>
                        <Edit className="mr-2 h-4 w-4" /> Редактирай
                    </Button>
                ) : (
                    <Button size="sm" onClick={handleSaveNotes}>
                        Запази
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {isEditingNotes ? (
                    <Textarea
                        value={currentNotes}
                        onChange={(e) => setCurrentNotes(e.target.value)}
                        placeholder="Добавете бележки тук..."
                        rows={5}
                        className="text-sm"
                    />
                ) : (
                    <p className="text-sm text-muted-foreground min-h-[100px]">
                        {member.notes || 'Няма добавени бележки.'}
                    </p>
                )}
            </CardContent>
        </Card>

        <SalesHistory memberId={id} />

    </div>
  );
};

export default MemberDetailsPage;
