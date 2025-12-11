
// src/app/finances/page.tsx

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DollarSign, ListChecks, FileText } from 'lucide-react';

const financeModules = [
  {
    title: 'Абонаменти',
    href: '/finances/subscriptions',
    icon: <ListChecks className="w-8 h-8" />,
    description: 'Управление на абонаментите на всички членове.'
  },
  {
    title: 'Плащания',
    href: '/finances/payments',
    icon: <DollarSign className="w-8 h-8" />,
    description: 'Преглед на историята на всички направени плащания.'
  },
  {
    title: 'Справки',
    href: '/finances/reports',
    icon: <FileText className="w-8 h-8" />,
    description: 'Генериране на финансови справки и отчети.'
  }
];

export default function FinancesPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Финансов център</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {financeModules.map((module) => (
          <Link href={module.href} key={module.href} passHref>
            <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl font-semibold">{module.title}</CardTitle>
                {module.icon}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{module.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
