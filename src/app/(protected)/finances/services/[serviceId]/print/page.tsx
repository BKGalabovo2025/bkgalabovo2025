import { getAdminDb } from '@/lib/firebase-admin';
import { notFound } from 'next/navigation';
import PrintClientPage from './PrintClientPage';

// --- Type Definition (includes ALL possible fields) ---
interface Service {
    id: string;
    name: string;
    price: number; // Stored in cents
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
// Fetches a single, complete service object from Firestore.
async function getService(id: string): Promise<Service | null> {
    if (!id || id === 'undefined') return null;

    try {
        const adminDb = getAdminDb();
        const serviceRef = adminDb.collection('clubServices').doc(id);
        const docSnap = await serviceRef.get();

        if (!docSnap.exists) {
            return null;
        }

        const data = docSnap.data()!;

        // The data is already in the correct format, including price in cents.
        return {
            id: docSnap.id,
            name: data.name || '',
            price: data.price || 0, // Keep price in cents
            description: data.description || '',
            currency: 'EUR',
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
    } catch (error) {
        console.error("Error fetching service for printing:", error);
        return null;
    }
}

// --- Page Component (React Server Component) ---
export default async function ServicePrintPage({ params }: { params: { serviceId: string } }) {
  
  // Per Next.js 13+ App Router, the `params` object can be a promise.
  // We must `await` it before accessing its properties.
  const resolvedParams = await params;
  const service = await getService(resolvedParams.serviceId);

  // If no service is found for any reason, show a 404 page.
  if (!service) {
    notFound();
  }

  // Pass the complete, live service data to the client component for rendering.
  return <PrintClientPage service={service} />;
}
