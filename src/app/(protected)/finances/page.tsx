
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListTree } from "lucide-react";

export default function FinancesPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Финансов Модул</h1>
      <p className="mb-6 text-muted-foreground">Тук можете да управлявате услугите, абонаментите и плащанията в клуба.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">
                    Каталог с Услуги
                </CardTitle>
                <ListTree className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground pb-4">
                    Управлявайте видовете абонаменти и такси, които клубът предлага.
                </p>
                <Button asChild>
                    <Link href="/finances/services">Към каталога</Link>
                </Button>
            </CardContent>
        </Card>
        {/* Бъдещи модули като "Плащания" и "Справки" ще бъдат добавени тук */}
      </div>
    </div>
  );
}
