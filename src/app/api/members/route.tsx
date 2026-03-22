
import { NextResponse } from 'next/server';
import { addMember } from '@/services/member-service';
import { createSubscription, getAllClubServices } from '@/services/subscription-service';
import { Subscription, Member } from '@/types';

// Тип за данните, необходими за създаване на нов член
type NewMemberData = Pick<Member, 'firstName' | 'lastName' | 'email'>;

// POST /api/members - Create a new member and a default subscription
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email } = body;

    // 1. Basic validation
    if (!firstName || !lastName || !email) {
      return new NextResponse('First name, last name, and email are required', { status: 400 });
    }

    // 2. Create the new member
    const memberData: NewMemberData = {
        firstName,
        lastName,
        email,
    };
    const newMemberId = await addMember(memberData);

    // 3. Find a default subscription service
    const allServices = await getAllClubServices();
    const defaultSubscriptionService = allServices.find(s => s.type === 'Абонамент');

    if (!defaultSubscriptionService) {
        console.error("CRITICAL: No default subscription service of type 'Абонамент' found.");
        // Return the member created, but flag that subscription failed.
        return NextResponse.json({ id: newMemberId, ...memberData, subscriptionStatus: 'failed' }, { status: 201 });
    }

    // 4. Create the subscription
    const subscriptionData: Omit<Subscription, 'id'> = {
        memberId: newMemberId,
        serviceId: defaultSubscriptionService.id,
        serviceName: defaultSubscriptionService.name,
        startDate: new Date().toISOString(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(), // Default to 1 month
        status: 'active',
        price: defaultSubscriptionService.price,
        currency: defaultSubscriptionService.currency,
        pricePaid: 0,
        paymentHistory: [],
        paymentsMadeCount: 0,
        totalPaymentsCount: 12, // Assuming yearly
        licenseGranted: false,
        apparelGranted: false,
        linkedSubscriptionId: null,
    };
    
    await createSubscription(subscriptionData, 'system', 'System');

    // 5. Construct and return the final response object
    const responsePayload = {
      id: newMemberId,
      ...memberData,
    };

    return NextResponse.json(responsePayload, { status: 201 });

  } catch (error) {
    console.error("Error in POST /api/members:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error', details: errorMessage }), { status: 500 });
  }
}
