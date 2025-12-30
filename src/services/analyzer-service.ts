
import { getEventsByMemberId } from './schedule-service';
import { getSubscriptionsByMemberId } from './subscription-service';
import { ClubService, Member, Subscription, ScheduleEvent, AssistantMessage, MemberAnalysis, AnalyzedSubscription } from '@/types';
import { getAllClubServices } from '@/services/subscription-service';
import { getAllMembers } from '@/services/member-service';
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
    const [allMembers, allServices] = await Promise.all([getAllMembers(), getAllClubServices()]);
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
        if (analysis.overallStatus === 'red') {
            for (const sub of analysis.analyzedSubscriptions) {
                if (sub.status === 'lapsing') {
                    messages.push({
                        id: `overdue-${member.id}-${sub.serviceName}`,
                        timestamp: new Date().toISOString(),
                        type: 'warning',
                        title: 'Просрочено плащане',
                        description: `${analysis.memberName}: Плащането за абонамент "${sub.serviceName}" е просрочено.`
                    });
                }
            }
        }

        // 2. Check for expiring subscriptions
        for (const sub of analysis.analyzedSubscriptions) {
            const subEndDate = new Date(sub.expiryDate);
            const timeDiff = subEndDate.getTime() - today.getTime();
            const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));

            if (daysUntilExpiry >= 0 && daysUntilExpiry <= 7) {
                messages.push({
                    id: `expiring-${member.id}-${sub.serviceName}`,
                    timestamp: new Date().toISOString(),
                    type: 'info',
                    title: 'Абонаментът изтича скоро',
                    description: `${analysis.memberName}: Абонаментът "${sub.serviceName}" изтича след ${daysUntilExpiry} дни.`
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
                    timestamp: new Date().toISOString(),
                    type: 'suggestion',
                    title: 'Препоръка за архивиране',
                    description: `${member.firstName} ${member.lastName}: Този член няма активност от над ${INACTIVITY_THRESHOLD_MONTHS} месеца. Може да се архивира.`
                });
            }

            // 4. Check for attendances without an active subscription (NEW)
            const hasActiveSubscription = subscriptions.some(sub => sub.status === 'active');
            const hasPendingSubscription = subscriptions.some(sub => sub.status === 'pending_payment');
            const hasAttendancesThisMonth = attendances.some(event => {
                const eventDate = new Date(event.startDate);
                return event.type === 'training' && eventDate >= currentMonthStart && eventDate <= currentMonthEnd;
            });

            if (hasAttendancesThisMonth && !hasActiveSubscription && !hasPendingSubscription) {
                messages.push({
                    id: `attendance-no-sub-${member.id}`,
                    timestamp: new Date().toISOString(),
                    type: 'warning',
                    title: 'Посещение без абонамент',
                    description: `${member.firstName} ${member.lastName}: Членът има посещения този месец, но няма активен или чакащ абонамент. Моля, създайте такъв.`
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
                    timestamp: new Date().toISOString(),
                    type: 'suggestion',
                    title: 'Оптимизация за семейство',
                    description: `Семейството на ${memberNames} плаща ${currentCost.toFixed(2)}€ за индивидуални абонаменти. Предложете им пакет "${familyService.name}" за ${familyService.price.toFixed(2)}€.`
                });
            }
        }
    }

    // --- FINAL MESSAGE ---
    if (messages.length === 0) {
        return [{
            id: 'all-ok',
            timestamp: new Date().toISOString(),
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
    memberSubscriptions: Subscription[],
    memberAttendances: ScheduleEvent[]
): Promise<MemberAnalysis> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const analyzedSubscriptions: AnalyzedSubscription[] = [];

    for (const sub of memberSubscriptions) {
        const subEndDate = new Date(sub.endDate);

        if (sub.status === 'inactive' || sub.status === 'cancelled') continue;
        if (subEndDate < today && sub.status !== 'pending_payment') continue;

        const service = allServices.find(s => s.id === sub.serviceId);
        if (!service) continue;

        let paymentStatus: 'active' | 'lapsing' | 'inactive' = 'inactive';
        let status: 'active' | 'lapsing' | 'inactive' = 'inactive';
        if (sub.status === 'active') {
            status = 'active';
        } else if (sub.status === 'pending_payment') {
            const paymentWindowEnd = service.paymentRules?.window.endDay;
            if (paymentWindowEnd && today.getDate() > paymentWindowEnd) {
                status = 'lapsing';
            }
        }

        analyzedSubscriptions.push({
            subscriptionId: sub.id,
            serviceName: service.name,
            status: status,
            paymentStatus: sub.status,
            startDate: sub.startDate,
            endDate: sub.endDate, 
            expiryDate: sub.endDate,
            paymentsBehind: sub.totalPaymentsCount - sub.paymentsMadeCount,
            attendanceSummary: ''
        });
    }

    const hasLapsing = analyzedSubscriptions.some(s => s.status === 'lapsing');
    const hasActive = analyzedSubscriptions.some(s => s.status === 'active');

    let overallStatus: 'green' | 'orange' | 'red' = 'green';
    if (hasLapsing) {
        overallStatus = 'red';
    } else if (hasActive) {
        overallStatus = 'green';
    } else {
        overallStatus = 'orange';
    }


    const analysisResult: MemberAnalysis = {
        memberId: member.id,
        memberName: `${member.firstName} ${member.lastName}`,
        analysisDate: new Date().toISOString(),
        overallStatus: overallStatus, 
        analyzedSubscriptions: analyzedSubscriptions, 
    };

    // Cache the result
    member.analysisCache = {
        generatedAt: new Date().toISOString(),
        result: analysisResult,
    };

    return analysisResult;
};
