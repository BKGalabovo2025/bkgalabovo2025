'use client';

import { useParams } from 'next/navigation';
import { useMemberProfile } from '@/hooks/useMemberProfile';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MemberDetailsCard } from '@/components/members/member-details-card'; // Import the centralized component

// Main Component
const MemberProfilePage = () => {
  const params = useParams();
  const memberId = params.id as string;

  // Use the existing hook to fetch all necessary data
  const { member, familyMembers, loading, error } = useMemberProfile(memberId);

  // Loading State
  if (loading) return (
    <div className="p-4 sm:p-6 space-y-4 animate-pulse">
        <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-28" />
        </div>
        <Card><CardContent className="p-4 flex items-center space-x-4"><Skeleton className="h-16 w-16 rounded-full" /><div className="space-y-2"><Skeleton className="h-7 w-48" /><Skeleton className="h-5 w-32" /></div></CardContent></Card>
        <Skeleton className="h-10 w-full" />
        <Card><CardContent className="p-6 space-y-4"><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /></CardContent></Card>
    </div>
  );

  // Error State
  if (error) return (
      <div className="p-4 sm:p-6">
          <Alert variant="destructive">
              <AlertTitle>Грешка</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
          </Alert>
      </div>
  );

  // Not Found State
  if (!member) return (
      <div className="p-4 sm:p-6">
          <Alert>
              <AlertTitle>Не е намерен член</AlertTitle>
              <AlertDescription>Няма член, съответстващ на това ID.</AlertDescription>
          </Alert>
      </div>
  );

  // Success State: Render the centralized and correct component
  return (
    <div className="p-4 sm:p-6 space-y-4">
      <MemberDetailsCard member={member} familyMembers={familyMembers} />
    </div>
  );
};

export default MemberProfilePage;
