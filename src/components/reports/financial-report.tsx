
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Payment, Member } from '@/types';
import { getAllPayments } from '@/services/finance-service';
import { getMembers } from '@/services/member-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addDays, format } from 'date-fns';
import { Loader2 } from 'lucide-react';

const FinancialReport = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters - state now holds Date objects
  const [dateFrom, setDateFrom] = useState<Date | undefined>(addDays(new Date(), -30));
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [paymentType, setPaymentType] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [allPayments, allMembers] = await Promise.all([
          getAllPayments(),
          getMembers(),
        ]);
        setPayments(allPayments);
        setMembers(allMembers);
      } catch (error) {
        console.error('Failed to fetch financial data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const filteredPayments = useMemo(() => {
    // Create new Date objects for comparison to avoid mutating state
    const startDate = dateFrom ? new Date(dateFrom) : null;
    if (startDate) startDate.setHours(0, 0, 0, 0);

    const endDate = dateTo ? new Date(dateTo) : null;
    if (endDate) endDate.setHours(23, 59, 59, 999);

    return payments.filter(p => {
      const paymentDate = new Date(p.paymentDate);
      
      const isInDateRange = 
        (!startDate || paymentDate >= startDate) &&
        (!endDate || paymentDate <= endDate);

      const isTypeMatch = paymentType === 'all' || p.type === paymentType;
      return isInDateRange && isTypeMatch;
    });
  }, [payments, dateFrom, dateTo, paymentType]);

  const totalAmount = useMemo(() => 
    filteredPayments.reduce((acc, p) => acc + p.amount, 0), 
  [filteredPayments]);

  // Handler to convert string from input to Date object
  const handleDateChange = (setter: (date: Date | undefined) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateString = e.target.value;
    // Input type=date returns '' if empty, and a 'yyyy-mm-dd' string if a date is selected.
    // new Date('') is an invalid date, so we must handle it.
    // We also need to add the timezone offset to avoid being off by one day.
    if (dateString) {
        const [year, month, day] = dateString.split('-').map(Number);
        setter(new Date(year, month - 1, day));
    } else {
        setter(undefined);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Финансов отчет</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Date Pickers as standard date inputs */}
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor='dateFrom'>От дата</Label>
            <Input
              id='dateFrom'
              type="date"
              value={dateFrom ? format(dateFrom, 'yyyy-MM-dd') : ''}
              onChange={handleDateChange(setDateFrom)}
              className="w-[200px]"
            />
          </div>
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor='dateTo'>До дата</Label>
            <Input
              id='dateTo'
              type="date"
              value={dateTo ? format(dateTo, 'yyyy-MM-dd') : ''}
              onChange={handleDateChange(setDateTo)}
              className="w-[200px]"
            />
          </div>

          {/* Payment Type Selector */}
          <div className="flex flex-col space-y-1.5">
            <Label>Тип плащане</Label>
            <Select value={paymentType} onValueChange={setPaymentType}>
                <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Тип плащане" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="all">Всички</SelectItem>
                <SelectItem value="Членски внос">Членски внос</SelectItem>
                <SelectItem value="Дарение">Дарение</SelectItem>
                <SelectItem value="Друго">Друго</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
            <div className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Зареждане на данните...</div>
        ) : (
          <Table>
             <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Член</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead className="text-right">Сума</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length > 0 ? (
                filteredPayments.map(p => {
                    const member = p.memberId ? memberMap.get(p.memberId) : null;
                    const memberName = member ? `${member.firstName} ${member.lastName}` : 'Н/А';
                    return (
                        <TableRow key={p.id}>
                            <TableCell>{new Date(p.paymentDate).toLocaleDateString('bg-BG')}</TableCell>
                            <TableCell>{memberName}</TableCell>
                            <TableCell>{p.type}</TableCell>
                            <TableCell className="text-right font-medium">{p.amount.toFixed(2)} лв.</TableCell>
                        </TableRow>
                    );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">Няма намерени плащания за избрания период.</TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="text-right font-bold">Общо:</TableCell>
                <TableCell className="text-right font-bold">{totalAmount.toFixed(2)} лв.</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default FinancialReport;
