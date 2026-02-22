'use client'; // This page now uses a client component

import { useParams } from 'next/navigation';
import ReceiptClientPage from './ReceiptClientPage';

// This page becomes a simple wrapper.
export default function ReceiptPage() {
    const params = useParams();
    const saleId = params.id as string;

    // Render the client component and pass the saleId to it.
    // ReceiptClientPage will handle all the data fetching, loading, and error states.
    return <ReceiptClientPage saleId={saleId} />;
}
