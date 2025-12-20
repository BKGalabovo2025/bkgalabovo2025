
export const dynamic = 'force-dynamic';

'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FinancialReport from "@/components/reports/financial-report";
import LiabilitiesReport from "@/components/reports/liabilities-report";
import RestockReport from "@/components/reports/restock-report";

const ReportsPage = () => {
    return (
        <div className="p-4 sm:p-6">
            <h1 className="text-3xl font-bold mb-6">Справки</h1>
            <Tabs defaultValue="financial" className="w-full">
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
                    <TabsTrigger value="financial">Финансова справка</TabsTrigger>
                    <TabsTrigger value="liabilities">Справка задължения</TabsTrigger>
                    <TabsTrigger value="restock">Справка презареждане</TabsTrigger>
                </TabsList>
                <TabsContent value="financial">
                    <FinancialReport />
                </TabsContent>
                <TabsContent value="liabilities">
                    <LiabilitiesReport />
                </TabsContent>
                <TabsContent value="restock">
                    <RestockReport />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ReportsPage;
