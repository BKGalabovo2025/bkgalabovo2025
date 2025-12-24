
import { getEventsByMemberId } from './schedule-service';
import { getSubscriptionsByMemberId } from './subscription-service';
import { ClubService, Member, MemberSubscription, ScheduleEvent, AssistantMessage, MemberAnalysis, AnalyzedSubscription } from '@/types';
import { getAllClubServices, getMembers } from '@/lib/actions/services';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';

// =============================================================================
// CONFIGURATION
// =============================================================================
const INACTIVITY_THRESHOLD_MONTHS = 6;

// =============================================================================
// GLOBAL ASSISTANT - The "Brain"
// =============================================================================

/**
 * Analyzes all members and generates a list of actionable messages for the dashboard assistant.
 */
export const getGlobalAssistantMessages = async (): Promise<AssistantMessage[]> => {
    const [allMembers, allServices] = await Promise.all([getMembers(), getAllClubServices()]);
    const messages: AssistantMessage[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const inactivityLimitDate = subMonths(today, INACTIVITY_THRESHOLD_MONTHS);
    const currentMonthStart = startOfMonth(today);
    const currentMonthEnd = endOfMonth(today);

    // --- INDIVIDUAL & INACTIVITY ANALYSIS ---
    for (const member of allMembers) {
        // Fetch all data for the member at once
        const [subscriptions, attendances] = await Promise.all([
            getSubscriptionsByMemberId(member.id),
            getEventsByMemberId(member.id)
        ]);

        const analysis = await analyzeMemberStatus(member, allServices, subscriptions, attendances);

        // 1. Check for payment-related issues
        if (analysis.overallStatus === 'ACTION_NEEDED') {
            for (const sub of analysis.analyzedSubscriptions) {
                if (sub.paymentStatus === 'OVERDUE') {
                    messages.push({
                        id: `overdue-${member.id}-${sub.subscriptionId}`,
                        type: 'warning',
                        title: `Просрочено плащане: ${analysis.memberName}`,
                        description: `Плащането за абонамент "${sub.serviceName}" е просрочено.`,
                    });
                }
            }
        }

        // 2. Check for expiring subscriptions
        for (const sub of analysis.analyzedSubscriptions) {
            const subEndDate = new Date(sub.endDate);
            const timeDiff = subEndDate.getTime() - today.getTime();
            const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));

            if (daysUntilExpiry >= 0 && daysUntilExpiry <= 7) {
                messages.push({
                    id: `expiring-${member.id}-${sub.subscriptionId}`,
                    type: 'suggestion',
                    title: `Абонаментът изтича скоро: ${analysis.memberName}`,
                    description: `Абонаментът "${sub.serviceName}" изтича след ${daysUntilExpiry} дни.`,
                });
            }
        }

        // Process checks only for currently active members
        if (member.status === 'active') {
            // 3. Check for inactive members
            const lastSubDate = subscriptions.reduce((latest, sub) => {
                const endDate = new Date(sub.endDate);
                return endDate > latest ? endDate : latest;
            }, new Date(0));

            const lastAttendanceDate = attendances.reduce((latest, event) => {
                const eventDate = new Date(event.startDate);
                return eventDate > latest ? eventDate : latest;
            }, new Date(0));

            if (lastSubDate < inactivityLimitDate && lastAttendanceDate < inactivityLimitDate) {
                messages.push({
                    id: `inactive-member-${member.id}`,
                    type: 'info',
                    title: `Препоръка за архивиране: ${member.firstName} ${member.lastName}`,
                    description: `Този член няма активност от над ${INACTIVITY_THRESHOLD_MONTHS} месеца. Може да се архивира.`,
                });
            }

            // 4. Check for attendances without an active subscription (NEW)
            const hasActiveSubscription = subscriptions.some(sub => sub.status === 'active');
            const hasPendingSubscription = subscriptions.some(sub => sub.status === 'pending_payment');
            const hasAttendancesThisMonth = attendances.some(event => {
                const eventDate = new Date(event.startDate);
                return event.type === 'trening' && eventDate >= currentMonthStart && eventDate <= currentMonthEnd;
            });

            if (hasAttendancesThisMonth && !hasActiveSubscription && !hasPendingSubscription) {
                messages.push({
                    id: `attendance-no-sub-${member.id}`,
                    type: 'warning',
                    title: `Посещение без абонамент: ${member.firstName} ${member.lastName}`,
                    description: `Членът има посещения този месец, но няма активен или чакащ абонамент. Моля, създайте такъв.`,
                });
            }
        }
    }

    // --- FAMILY ANALYSIS ---
    const families: Record<string, Member[]> = {};
    allMembers.forEach(member => {
        if (member.familyId) {
            if (!families[member.familyId]) { families[member.familyId] = []; }
            families[member.familyId].push(member);
        }
    });

    for (const familyId in families) {
        const familyMembers = families[familyId];
        if (familyMembers.length < 2) continue;

        const memberIds = familyMembers.map(m => m.id);
        const memberNames = familyMembers.map(m => `${m.firstName} ${m.lastName}`).join(', ');

        const subsPromises = memberIds.map(id => getSubscriptionsByMemberId(id));
        const subsByMember = await Promise.all(subsPromises);
        const allFamilySubs = subsByMember.flat().filter(sub => sub.status === 'active');

        const individualSubs = allFamilySubs.filter(sub => {
            const service = allServices.find(s => s.id === sub.serviceId);
            return service && service.minMembers <= 1;
        });

        if (individualSubs.length < 2) continue;

        const currentCost = individualSubs.reduce((total, sub) => total + sub.pricePaid, 0);
        const familyServices = allServices.filter(s => s.minMembers > 1 && s.minMembers <= familyMembers.length);

        for (const familyService of familyServices) {
            if (familyService.price < currentCost) {
                messages.push({
                    id: `family-pack-suggestion-${familyId}-${familyService.id}`,
                    type: 'suggestion',
                    title: `Оптимизация за семейство`,
                    description: `Семейството на ${memberNames} плаща ${currentCost.toFixed(2)}€ за индивидуални абонаменти. Предложете им пакет "${familyService.name}" за ${familyService.price.toFixed(2)}€.`,
                });
            }
        }
    }

    // --- FINAL MESSAGE ---
    if (messages.length === 0) {
        return [{
            id: 'all-ok',
            type: 'info',
            title: 'Всичко е наред!',
            description: 'Нямате нужда от действия в момента. Системата не откри просрочени плащания, изтичащи абонаменти или други възможности за оптимизация.'
        }];
    }

    return messages;
};


// =============================================================================
// CORE ANALYZER - Analyzes a single member
// =============================================================================

export const analyzeMemberStatus = async (
    member: Member,
    allServices: ClubService[],
    memberSubscriptions: MemberSubscription[],
    memberAttendances: ScheduleEvent[]
): Promise<MemberAnalysis> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const analyzedSubscriptions: AnalyzedSubscription[] = [];

    for (const sub of memberSubscriptions) {
        const subEndDate = new Date(sub.endDate);

        if (sub.status === 'expired' || sub.status === 'cancelled') continue;
        if (subEndDate < today && sub.status !== 'pending_payment') continue;

        const service = allServices.find(s => s.id === sub.serviceId);
        if (!service) continue;

        let paymentStatus: 'PAID' | 'PENDING' | 'OVERDUE' = 'PENDING';
        if (sub.status === 'active') {
            paymentStatus = 'PAID';
        } else if (sub.status === 'pending_payment') {
            const paymentWindowEnd = service.paymentRules?.window.endDay;
            if (paymentWindowEnd && today.getDate() > paymentWindowEnd) {
                paymentStatus = 'OVERDUE';
            }
        }

        const relevantAttendances = memberAttendances.filter(att => {
            const attDate = new Date(att.startDate);
            return attDate >= new Date(sub.startDate) && attDate <= subEndDate;
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
            recommendations: [],
        });
    }

    const hasActionNeeded = analyzedSubscriptions.some(s => s.paymentStatus === 'OVERDUE' || s.paymentStatus === 'PENDING');
    const overallStatus: MemberAnalysis['overallStatus'] = hasActionNeeded ? 'ACTION_NEEDED' : 'OK';

    return {
        memberId: member.id,
        memberName: `${member.firstName} ${member.lastName}`,
        analysisDate: new Date().toISOString(),
        overallStatus: overallStatus,
        analyzedSubscriptions: analyzedSubscriptions, // Corrected from activeSubscriptions to analyzedSubscriptions
    };
};
