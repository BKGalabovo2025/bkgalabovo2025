import HistoryClientPage from './HistoryClientPage';
import { notFound } from 'next/navigation';

// --- Page Component (React Server Component) ---

// This is an async Server Component that unwraps the route parameters.
export default async function ServiceHistoryPage({ params }: { params: { serviceId: string } }) {

  // Per Next.js 13+ App Router, the `params` object can be a promise.
  // We must `await` it before accessing its properties.
  const resolvedParams = await params;
  const { serviceId } = resolvedParams;

  // If the serviceId is missing or invalid, show a 404 page immediately.
  if (!serviceId || serviceId === 'undefined') {
    notFound();
  }

  // We pass the resolved ID to the client component, which handles all data fetching.
  return <HistoryClientPage serviceId={serviceId} />;
}
