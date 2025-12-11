
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FinancesLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = pathname.split('/').pop() || 'payments';

  const handleTabChange = (value: string) => {
    router.push(`/finances/${value}`);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Финанси</h1>
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="payments">Плащания</TabsTrigger>
          <TabsTrigger value="subscriptions">Абонаменти</TabsTrigger>
        </TabsList>
      </Tabs>
      <main>{children}</main>
    </div>
  );
};

export default FinancesLayout;
