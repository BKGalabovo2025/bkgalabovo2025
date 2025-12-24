
import { getEventsByMemberId } from './schedule-service';
import { getSubscriptionsByMemberId } from './subscription-service';
import { ClubService, Member, MemberSubscription, ScheduleEvent } from '@/types';
import { getAllClubServices } from './subscription-service';

// =============================================================================
// TYPE DEFINITIONS FOR ANALYSIS RESULTS
// =============================================================================

/**
 * Represents the overall analysis status for a member.
 */
export type MemberAnalysis = {
    memberId: string;
    analysisDate: string;
    overallStatus: 'OK' | 'ACTION_NEEDED' | 'WARNING';
    activeSubscriptions: AnalyzedSubscription[];
    // Future additions could include attendance patterns, payment history, etc.
};

/**
 * Represents the detailed analysis of a single active subscription.
 */
export type AnalyzedSubscription = {
    subscriptionId: string;
    serviceName: string;
    status: MemberSubscription['status'];
    startDate: string;
    endDate: string;
    paymentStatus: 'PAID' | 'PENDING' | 'OVERDUE';
    attendanceSummary: {
        totalAttended: number;
        // More details to be added, e.g., attended in billing period
    };
    // Recommendations will be added in the next phase
    recommendations: string[]; 
};

// =============================================================================
// CORE ANALYZER SERVICE
// =============================================================================

/**
 * The main analysis function.
 * It fetches all relevant data for a member and performs a comprehensive analysis.
 *
 * @param member The Member object to analyze.
 * @returns A promise that resolves to a MemberAnalysis object.
 */
export const analyzeMemberStatus = async (member: Member): Promise<MemberAnalysis> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Fetch all necessary data in parallel
    const [allServices, memberSubscriptions, memberAttendances] = await Promise.all([
        getAllClubServices(),
        getSubscriptionsByMemberId(member.id),
        getEventsByMemberId(member.id)
    ]);

    const trainingAttendances = memberAttendances.filter(event => event.type === 'trening');

    // 2. Analyze active/relevant subscriptions
    const analyzedSubscriptions: AnalyzedSubscription[] = [];

    for (const sub of memberSubscriptions) {
        // We only care about subscriptions that are currently active or pending
        const subStartDate = new Date(sub.startDate);
        const subEndDate = new Date(sub.endDate);

        if (sub.status === 'expired' || sub.status === 'cancelled') continue; // Skip irrelevant subscriptions
        if (subEndDate < today && sub.status !== 'pending_payment') continue; // Skip past subscriptions unless payment is still pending

        const service = allServices.find(s => s.id === sub.serviceId);
        if (!service) continue; // Should not happen in consistent data

        let paymentStatus: 'PAID' | 'PENDING' | 'OVERDUE' = 'PENDING';
        if (sub.status === 'active') {
            paymentStatus = 'PAID';
        } else if (sub.status === 'pending_payment') {
            const paymentWindowEnd = service.paymentRules?.window.endDay;
            if (paymentWindowEnd && today.getDate() > paymentWindowEnd) {
                // This logic is simple, needs refinement. 
                // It assumes the sub is for the current month.
                paymentStatus = 'OVERDUE';
            }
        }

        const relevantAttendances = trainingAttendances.filter(att => {
            const attDate = new Date(att.startDate);
            return attDate >= subStartDate && attDate <= subEndDate;
        });

        analyzedSubscriptions.push({
            subscriptionId: sub.id,
            serviceName: service.name,
            status: sub.status,
            startDate: sub.startDate,
            endDate: sub.endDate,
            paymentStatus: paymentStatus,
            attendanceSummary: {
                totalAttended: relevantAttendances.length,
            },
            recommendations: [], // To be implemented later
        });
    }

    // 3. Determine overall status
    const hasActionNeeded = analyzedSubscriptions.some(s => s.paymentStatus === 'OVERDUE' || s.paymentStatus === 'PENDING');
    const overallStatus: MemberAnalysis['overallStatus'] = hasActionNeeded ? 'ACTION_NEEDED' : 'OK';

    // 4. Compile and return the final analysis object
    return {
        memberId: member.id,
        analysisDate: new Date().toISOString(),
        overallStatus: overallStatus,
        activeSubscriptions: analyzedSubscriptions,
    };
};
