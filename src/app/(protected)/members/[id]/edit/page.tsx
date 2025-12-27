'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMember } from '@/hooks/useMembers';
import { updateMember } from '@/services/member-service';
import { useToast } from '@/components/ui/use-toast';
import { MemberForm } from '@/components/members/member-form';
import { Loader2, AlertCircle } from 'lucide-react';
import { Member } from '@/types';

const EditMemberPage = () => {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const memberId = params.id as string;

  const { member, loading, error } = useMember(memberId);

  const handleSave = async (data: Omit<Member, 'id'>) => {
    try {
      await updateMember(memberId, data);
      toast({ title: 'Успех!', description: 'Членът е актуализиран успешно.' });
      router.push(`/members/${memberId}`);
      router.refresh(); // Force a refresh to reflect changes
    } catch (e) {
      toast({ title: 'Грешка', description: 'Неуспешно актуализиране на члена.', variant: 'destructive' });
    }
  };

  const handleClose = () => {
    router.back();
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin" /></div>;
  }

  if (error || !member) {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-destructive">
            <AlertCircle className="h-12 w-12 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Грешка при зареждане</h2>
            <p>{error || 'Членът не е намерен'}</p>
        </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-4">Редактиране на член</h1>
      <MemberForm member={member} onSave={handleSave} onClose={handleClose} />
    </div>
  );
};

export default EditMemberPage;
