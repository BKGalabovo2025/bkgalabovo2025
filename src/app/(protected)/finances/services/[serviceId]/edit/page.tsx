import { adminDb } from '@/lib/firebase-admin';
import { notFound } from 'next/navigation';
import ServiceForm from './ServiceForm';

// --- Type Definition ---
interface Service {
    id: string;
    name: string;
    price: number; 
    currency: string;
    description: string;
    type: string;
    billingPeriod?: string;
    targetGroups?: string[];
    grantsLicense?: boolean;
    licenseCondition?: string;
    licensePaymentCount?: number;
    grantsApparel?: boolean;
    apparelCondition?: string;
    apparelPaymentCount?: number;
    durationMinutes?: number;
}

// --- Data Fetching (Server-side) ---
async function getService(id: string): Promise<Service | null> {
    if (!id) return null;

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
        currency: data.currency || 'BGN',
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

// --- Page Component (React Server Component) ---
export default async function EditServicePage({ params }: { params: { serviceId: string } }) {
  
  // Per Next.js 14+ and Turbopack, `params` can be a Promise and must be awaited.
  const resolvedParams = await params;
  const serviceId = resolvedParams.serviceId;
  const service = await getService(serviceId);

  if (!service) {
    notFound();
  }

  return <ServiceForm service={service} />;
}
