
import { redirect } from 'next/navigation';

const FinancesPage = () => {
  redirect('/finances/payments');
  return null; // This component will not render anything
};

export default FinancesPage;
