
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

interface Service {
    id: string;
    name: string;
    price: number;
    description: string;
    currency: string;
    type: string;
    billingPeriod?: string;
    targetGroups: string[];
    grantsLicense: boolean;
    licenseCondition?: string;
    licensePaymentCount?: number;
    grantsApparel: boolean;
    apparelCondition?: string;
    apparelPaymentCount?: number;
    durationMinutes?: number;
}

async function getService(id: string): Promise<Service | null> {
    if (!id) return null;

    const adminDb = getAdminDb();
    const serviceRef = adminDb.collection('clubServices').doc(id);
    const docSnap = await serviceRef.get();

    if (!docSnap.exists) {
        return null;
    }

    const data = docSnap.data()!;

    const priceInMainUnit = (data.price || 0) / 100;

    return {
        id: docSnap.id,
        name: data.name || '',
        price: priceInMainUnit,
        description: data.description || '',
        currency: data.currency || 'EUR',
        type: data.type || 'one-time',
        billingPeriod: data.billingPeriod,
        targetGroups: data.targetGroups || [],
        grantsLicense: data.grantsLicense || false,
        licenseCondition: data.licenseCondition,
        licensePaymentCount: data.licensePaymentCount,
        grantsApparel: data.grantsApparel || false,
        apparelCondition: data.apparelCondition,
        apparelPaymentCount: data.apparelPaymentCount,
        durationMinutes: data.durationMinutes,
    };
}


export async function GET(request: NextRequest, context: { params: Promise<{ serviceId: string }> }) {
    try {
        const { serviceId } = await context.params;
        const service = await getService(serviceId);

        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }

        return NextResponse.json(service);
    } catch (error) {
        console.error('Error fetching service:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
