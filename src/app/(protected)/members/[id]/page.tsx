"use client";

import { useParams } from "next/navigation";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Users } from "lucide-react";
import { MemberDetailsCard } from "@/components/members/member-details-card"; // Import the centralized component

// Main Component
const MemberProfilePage = () => {
  const params = useParams();
  const memberId = params.id as string;

  // Use the existing hook to fetch all necessary data
  const { member, familyMembers, loading, error } = useMemberProfile(memberId);

  // Loading State
  if (loading)
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex justify-between items-center">
          <Skeleton className="h-12 w-48 rounded-2xl" />
          <Skeleton className="h-12 w-32 rounded-2xl" />
        </div>
        <Card className="rounded-3xl border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
          <CardContent className="p-8 flex items-center space-x-6">
            <Skeleton className="h-24 w-24 rounded-3xl" />
            <div className="space-y-3">
              <Skeleton className="h-10 w-64 rounded-xl" />
              <Skeleton className="h-6 w-40 rounded-lg" />
            </div>
          </CardContent>
        </Card>
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Card className="rounded-3xl border-zinc-200 dark:border-zinc-800 shadow-xl">
          <CardContent className="p-10 space-y-6">
            <Skeleton className="h-8 w-full rounded-lg" />
            <Skeleton className="h-8 w-3/4 rounded-lg" />
            <Skeleton className="h-8 w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>
    );

  // Error State
  if (error)
    return (
      <div className="flex flex-col items-center justify-center py-48 bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/20 animate-in fade-in duration-500">
        <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 mb-6">
          <AlertTriangle className="h-12 w-12" />
        </div>
        <h2 className="text-2xl font-bold font-heading text-red-700 dark:text-red-400">Грешка при зареждане</h2>
        <p className="text-red-600/70 mt-2 font-medium">{error}</p>
      </div>
    );

  // Not Found State
  if (!member)
    return (
      <div className="flex flex-col items-center justify-center py-48 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 animate-in fade-in duration-500">
        <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-6">
          <Users className="h-12 w-12" />
        </div>
        <h2 className="text-2xl font-bold font-heading">Членът не е намерен</h2>
        <p className="text-zinc-500 mt-2 font-medium">Няма член, съответстващ на това ID в нашата база данни.</p>
      </div>
    );

  // Success State: Render the centralized and correct component
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <MemberDetailsCard member={member} familyMembers={familyMembers} />
    </div>
  );
};

export default MemberProfilePage;
