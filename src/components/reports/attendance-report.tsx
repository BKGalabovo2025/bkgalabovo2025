// src/components/reports/attendance-report.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker"; // Assuming you have this component
import {
  generateAttendanceReport,
  AttendanceReportItem,
} from "@/services/report-service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { downloadCSV } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const AttendanceReport = () => {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [reportData, setReportData] = useState<AttendanceReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      setError("Моля, изберете начална и крайна дата.");
      return;
    }
    setError(null);
    setIsLoading(true);
    setReportData([]);
    try {
      const data = await generateAttendanceReport(startDate, endDate);
      setReportData(data);
    } catch (err) {
      setError("Възникна грешка при генериране на справката.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (reportData.length === 0) return;

    const csvData = reportData.map((item) => ({
      Име: item.member.firstName,
      Фамилия: item.member.lastName,
      "Брой посещения": item.member.email,
      Телефон: item.member.phone,
      Посещения: item.attendanceCount,
    }));

    downloadCSV(
      csvData,
      `attendance-report-${format(new Date(), "yyyy-MM-dd")}.csv`
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Справка Присъствия</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
          <DatePicker
            date={startDate}
            setDate={setStartDate}
            placeholder="Начална дата"
          />
          <DatePicker
            date={endDate}
            setDate={setEndDate}
            placeholder="Крайна дата"
          />
          <Button onClick={handleGenerateReport} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Генерирай
          </Button>
          {reportData.length > 0 && (
            <Button onClick={handleExport} variant="outline">
              Експорт
            </Button>
          )}
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {isLoading && <div className="text-center p-4">Зареждане...</div>}

        {!isLoading && reportData.length === 0 && !error && (
          <p className="text-center text-muted-foreground pt-4">
            Няма данни за избрания период.
          </p>
        )}

        {reportData.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Име на член</TableHead>
                <TableHead className="text-right">Брой посещения</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((item) => (
                <TableRow key={item.member.id}>
                  <TableCell>{`${item.member.firstName} ${item.member.lastName}`}</TableCell>
                  <TableCell className="text-right">
                    {item.attendanceCount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default AttendanceReport;
