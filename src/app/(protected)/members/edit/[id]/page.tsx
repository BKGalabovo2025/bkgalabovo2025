'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getMemberById, updateMember } from '@/services/member-service';
import { Member } from '@/types';
import { useToast } from "@/components/ui/use-toast";

import { MemberForm } from '@/components/members/member-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const EditMemberPage = () => {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const memberId = params.id as string;

  useEffect(() => {
    if (memberId) {
      getMemberById(memberId)
        .then(data => {
          if (data) {
            setMember(data);
          } else {
            toast({ title: "Грешка", description: "Членът не е намерен.", variant: "destructive" });
            router.push('/members');
          }
        })
        .catch(error => {
          console.error("Грешка при зареждане на члена:", error);
          toast({ title: "Грешка", description: "Неуспешно зареждане на данните за члена.", variant: "destructive" });
        })
        .finally(() => setLoading(false));
    }
  }, [memberId, router, toast]);

  const handleSave = async (data: Omit<Member, 'id'>) => {
    try {
      await updateMember(memberId, data);
      toast({ title: "Успех!", description: "Данните на члена бяха актуализирани." });
      router.push(`/members/${memberId}`);
    } catch (error) {
      console.error("Грешка при актуализиране на члена:", error);
      toast({ title: "Грешка", description: "Възникна проблем при записа на данните.", variant: "destructive" });
    }
  };

  const handleClose = () => {
    router.push(`/members/${memberId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
        <Card>
            <CardHeader>
                <CardTitle>Редактиране на член</CardTitle>
            </CardHeader>
            <CardContent>
                {member ? (
                    <MemberForm member={member} onSave={handleSave} onClose={handleClose} />
                ) : (
                    <p>Този член не може да бъде зареден.</p>
                )}
            </CardContent>
        </Card>
    </div>
  );
};

export default EditMemberPage;
