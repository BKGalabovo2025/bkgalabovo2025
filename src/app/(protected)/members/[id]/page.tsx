
'use client';

import { useParams } from 'next/navigation';
import { useMember, useMembers } from '@/hooks/useMembers';
import { MemberDetailsCard } from '@/components/members/member-details-card';
import { Loader2, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Member } from '@/types';

/**
 * This is the main page component for displaying the details of a single member.
 * It has been refactored to use the centralized `useMember` and `useMembers` hooks,
 * ensuring that all data fetching is robust, consistent, and free of the `undefined` ID bug.
 */
const MemberDetailsPage = () => {
    const params = useParams();
    const memberId = params.id as string;

    // Use the robust, centralized hook to fetch the primary member's details.
    // This hook handles its own loading, error, and state management.
    const { member, loading: memberLoading, error: memberError } = useMember(memberId);
    
    // Use the centralized hook to fetch all members. This is needed to find family members.
    // This hook is also robust and filters out any invalid data at the source.
    const { members: allMembers, loading: allMembersLoading, error: allMembersError } = useMembers();

    // State to hold the filtered list of family members.
    const [familyMembers, setFamilyMembers] = useState<Member[]>([]);

    useEffect(() => {
        // This effect runs when the main member and the list of all members are available.
        if (member && allMembers.length > 0) {
            // If the member has a familyId, filter `allMembers` to find other members
            // of the same family. Exclude the member themselves from this list.
            if (member.familyId) {
                const filteredFamily = allMembers.filter(
                    (m) => m.familyId === member.familyId && m.id !== member.id
                );
                setFamilyMembers(filteredFamily);
            } else {
                // If the member has no family, the list is empty.
                setFamilyMembers([]);
            }
        }
    }, [member, allMembers]); // Re-run the effect if the member or the members list changes.

    // Unified loading and error states.
    const isLoading = memberLoading || allMembersLoading;
    const error = memberError || allMembersError;

    // Display a loading spinner while data is being fetched.
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4 text-lg text-muted-foreground">Зареждане на информацията...</p>
            </div>
        );
    }

    // Display a prominent error message if any part of the data fetching fails.
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-destructive">
                <AlertCircle className="h-12 w-12 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Грешка при зареждане</h2>
                <p>{error}</p>
            </div>
        );
    }

    // If the member is not found after loading, show a specific message.
    if (!member) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                <AlertCircle className="h-12 w-12 mb-4 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Членът не е намерен</h2>
                <p className="text-muted-foreground">Няма член на клуба с посоченото ID.</p>
            </div>
        );
    }

    // Once all data is loaded and valid, render the details card.
    // The `familyMembers` array passed here is guaranteed to be clean.
    return (
        <div className="p-4 sm:p-6">
            <MemberDetailsCard member={member} familyMembers={familyMembers} />
            {/* Additional components for analysis, sales history, etc., can be added here */}
        </div>
    );
};

export default MemberDetailsPage;
