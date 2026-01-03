import { use } from 'react';
import HistoryClientPage from './HistoryClientPage';
import { notFound } from 'next/navigation';

// --- Page Component (React Server Component) ---

// This component is a simple, non-async Server Component.
// Its only job is to unwrap the params and pass the ID to the client.
export default function ServiceHistoryPage({ params }: { params: { serviceId: string } }) {
  
  // In dynamic routes, `params` is a Promise. We MUST unwrap it with `use`.
  const resolvedParams = use(params);
  const serviceId = resolvedParams.serviceId;

  // If the serviceId is missing or invalid, show a 404 page immediately.
  if (!serviceId || serviceId === 'undefined') {
    notFound();
  }

  // We pass the resolved ID to the client component, which handles all data fetching.
  // This architecture avoids the previous complex errors.
  return <HistoryClientPage serviceId={serviceId} />;
}
