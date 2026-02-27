import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListTree, CreditCard, History } from "lucide-react";

export default function FinancesPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Финансов Модул</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* КАРТА 1 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">Услуги</CardTitle>
            <ListTree className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full"><Link href="/finances/services">Каталог</Link></Button>
          </CardContent>
        </Card>

        {/* КАРТА 2 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">Абонаменти</CardTitle>
            <CreditCard className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full"><Link href="/finances/subscriptions">Списък</Link></Button>
          </CardContent>
        </Card>

        {/* КАРТА 3 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">Продажби</CardTitle>
            <History className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full"><Link href="/sales">История</Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}