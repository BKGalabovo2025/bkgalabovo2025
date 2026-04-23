"use client";

import { useState } from "react";
import { Member } from "@/types";
import { generateLiabilityReport } from "@/services/report-service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportToCSV } from "@/lib/export-utils";

// Генерираме последните 5 години за падащото меню
const years = Array.from({ length: 5 }, (_, i) =>
  (new Date().getFullYear() - i).toString()
);
const months = [
  { value: "1", label: "Януари" },
  { value: "2", label: "Февруари" },
  { value: "3", label: "Март" },
  { value: "4", label: "Април" },
  { value: "5", label: "Май" },
  { value: "6", label: "Юни" },
  { value: "7", label: "Юли" },
  { value: "8", label: "Август" },
  { value: "9", label: "Септември" },
  { value: "10", label: "Октомври" },
  { value: "11", label: "Ноември" },
  { value: "12", label: "Декември" },
];

const LiabilitiesReport = () => {
  const [unpaidMembers, setUnpaidMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const reportData = await generateLiabilityReport(
        parseInt(year, 10),
        parseInt(month, 10)
      );
      setUnpaidMembers(reportData);
    } catch (error) {
      console.error("Failed to generate liability report:", error);
      setUnpaidMembers([]); // Clear previous results on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const dataToExport = unpaidMembers.map((member) => ({
      Име: member.firstName,
      Фамилия: member.lastName,
      Имейл: member.email || "Н/А",
      Телефон: member.phone || "Н/А",
    }));
    exportToCSV(dataToExport, `Справка-задължения-${month}-${year}.csv`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg">
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger>
            <SelectValue placeholder="Избери година" />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger>
            <SelectValue placeholder="Избери месец" />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleGenerateReport} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Генерирай справка
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Резултати</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={unpaidMembers.length === 0 || isLoading}
          >
            <Download className="mr-2 h-4 w-4" />
            Експорт (CSV)
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="mr-2 h-8 w-8 animate-spin" />
            </div>
          ) : !hasSearched ? (
            <p>Моля, изберете период и генерирайте справката.</p>
          ) : unpaidMembers.length === 0 ? (
            <p>Няма намерени задължения за избрания период.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Име на член</TableHead>
                  <TableHead>Имейл</TableHead>
                  <TableHead>Телефон</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unpaidMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>{`${member.firstName} ${member.lastName}`}</TableCell>
                    <TableCell>{member.email || "Н/А"}</TableCell>
                    <TableCell>{member.phone || "Н/А"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LiabilitiesReport;
