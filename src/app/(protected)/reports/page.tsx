
import LiabilitiesReport from '@/components/reports/liabilities-report';
import FinancialReport from '@/components/reports/financial-report';
import RestockReport from '@/components/reports/restock-report'; // Import the new component

const ReportsPage = () => {

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Документи и справки</h1>
      
      {/* Restock Report Section */}
      <section>
        <RestockReport />
      </section>

      {/* Financial Report Section */}
      <section>
        <FinancialReport />
      </section>

      {/* Liability Report Section */}
      <section>
        <LiabilitiesReport />
      </section>

    </div>
  );
};

export default ReportsPage;
