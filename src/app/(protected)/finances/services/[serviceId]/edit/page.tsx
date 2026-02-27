'use client';

import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import ServiceForm from './ServiceForm';
import { Loader2 } from 'lucide-react';

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

// --- Page Component (Client Component) ---
export default function EditServicePage() {
    const params = useParams();
    const serviceId = params.serviceId as string;
    const [service, setService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!serviceId) return;

        const fetchService = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/services/${serviceId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch service');
                }
                const data = await response.json();
                setService(data);
            } catch (err) {
                setError(true);
                console.error(err);
            }
            setLoading(false);
        };

        fetchService();
    }, [serviceId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (error) {
        notFound();
    }

    if (!service) {
        return null; // Or some other placeholder
    }

    return <ServiceForm service={service} />;
}
