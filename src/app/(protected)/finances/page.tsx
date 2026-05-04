import { Landmark, ListTree, CreditCard, Package, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralServicesManager } from "@/components/finances/general-services-manager";
import { SubscriptionServicesManager } from "@/components/finances/subscription-services-manager";
import { InventoryManager } from "@/components/finances/inventory-manager";
import { SalesManager } from "@/components/finances/sales-manager";

export default function FinancesPage() {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Premium Header */}
      <header className="relative p-10 rounded-[3rem] overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
                <Landmark className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight font-heading text-zinc-900 dark:text-white">
                Финансов Модул
              </h1>
            </div>
            <p className="text-zinc-500 text-lg font-medium max-w-2xl pl-1">
              Управлявайте услугите, абонаментите и инвентара на клуба от едно централизирано и защитено място.
            </p>
          </div>
        </div>
      </header>

      <Tabs defaultValue="services" className="space-y-8">
        <div className="sticky top-0 z-40 py-4 -my-4 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-md">
          <TabsList className="bg-zinc-200/50 dark:bg-zinc-900/50 p-1.5 rounded-[2.5rem] h-20 w-full md:w-auto inline-flex shadow-inner border border-zinc-200 dark:border-zinc-800">
            <TabsTrigger 
              value="services" 
              className="rounded-[2rem] px-10 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-xl data-[state=active]:text-blue-600 transition-all duration-300 h-full font-black text-xs uppercase tracking-widest gap-3"
            >
              <ListTree className="h-5 w-5" />
              Услуги
            </TabsTrigger>
            <TabsTrigger 
              value="subscriptions" 
              className="rounded-[2rem] px-10 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-xl data-[state=active]:text-blue-600 transition-all duration-300 h-full font-black text-xs uppercase tracking-widest gap-3"
            >
              <CreditCard className="h-5 w-5" />
              Абонаменти
            </TabsTrigger>
            <TabsTrigger 
              value="inventory" 
              className="rounded-[2rem] px-10 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-xl data-[state=active]:text-blue-600 transition-all duration-300 h-full font-black text-xs uppercase tracking-widest gap-3"
            >
              <Package className="h-5 w-5" />
              Инвентар
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="rounded-[2rem] px-10 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-xl data-[state=active]:text-blue-600 transition-all duration-300 h-full font-black text-xs uppercase tracking-widest gap-3"
            >
              <History className="h-5 w-5" />
              История
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="services" className="animate-in fade-in slide-in-from-left-4 duration-500 focus-visible:outline-none">
          <GeneralServicesManager />
        </TabsContent>

        <TabsContent value="subscriptions" className="animate-in fade-in slide-in-from-left-4 duration-500 focus-visible:outline-none">
          <SubscriptionServicesManager />
        </TabsContent>

        <TabsContent value="inventory" className="animate-in fade-in slide-in-from-left-4 duration-500 focus-visible:outline-none">
          <InventoryManager />
        </TabsContent>

        <TabsContent value="history" className="animate-in fade-in slide-in-from-left-4 duration-500 focus-visible:outline-none">
          <SalesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
