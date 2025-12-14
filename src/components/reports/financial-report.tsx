
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Payment, Member } from '@/types';
import { getAllPayments } from '@/services/finance-service';
import { getMembers } from '@/services/member-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const FinancialReport = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
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
        // You should add a toast notification here for the user
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const paymentDate = new Date(p.paymentDate);
      const isInDateRange = 
        (!dateRange?.from || paymentDate >= dateRange.from) &&
        (!dateRange?.to || paymentDate <= dateRange.to);
      const isTypeMatch = paymentType === 'all' || p.type === paymentType;
      return isInDateRange && isTypeMatch;
    });
  }, [payments, dateRange, paymentType]);

  const totalAmount = useMemo(() => 
    filteredPayments.reduce((acc, p) => acc + p.amount, 0), 
  [filteredPayments]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Финансов отчет</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn('w-[300px] justify-start text-left font-normal', !dateRange && 'text-muted-foreground')}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>{format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}</>
                  ) : (
                    format(dateRange.from, 'LLL dd, y')
                  )
                ) : (
                  <span>Изберете период</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {/* Payment Type Selector */}
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
