"use client";

import { CheckCircle2, HeartPulse } from "lucide-react";
import Link from "next/link";
import React from "react";

import { useCampContext } from "@/components/camps/CampContext";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function AttendeesSectionView() {
  const { camp } = useCampContext();
  const attendeesCount = camp.attendees?.length || 0;

  return (
    <Card className="border border-zinc-200/80 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60">
      <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 pb-4 dark:border-zinc-800 dark:bg-zinc-800/40">
        <CardTitle className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">
          Списък с участници ({attendeesCount})
        </CardTitle>
        <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
          Таблица с всички записани състезатели, стаи, капаро, доплащания и
          застраховки.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {attendeesCount === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Няма записани участници.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-100 dark:border-zinc-800">
                  <TableHead className="whitespace-nowrap">Име</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Стая</TableHead>
                  <TableHead className="text-center">Капаро</TableHead>
                  <TableHead className="text-center">Доплащане</TableHead>
                  <TableHead className="text-center">Застрах.</TableHead>
                  <TableHead className="text-center">Мед.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {camp.attendees?.map((att, index) => {
                  const isAllGood =
                    att.campDepositPaid &&
                    att.campRemainderPaid &&
                    att.campInsurancePaid &&
                    att.campMedicalProvided;

                  const displayName = att.isGuest
                    ? att.guestName || "Гост"
                    : att.name;

                  return (
                    <TableRow
                      key={att.memberId || index}
                      className={
                        isAllGood
                          ? "bg-emerald-50/50 hover:bg-emerald-50 dark:bg-emerald-900/10 dark:hover:bg-emerald-900/20"
                          : "border-zinc-100 dark:border-zinc-800"
                      }
                    >
                      <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                        {att.memberId && !att.isGuest ? (
                          <Link
                            href={`/members/${att.memberId}`}
                            className="text-primary hover:underline"
                          >
                            {displayName}
                          </Link>
                        ) : (
                          displayName
                        )}
                      </TableCell>
                      <TableCell>
                        {att.isGuest ? (
                          <Badge
                            variant="outline"
                            className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                          >
                            Гост
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          >
                            Член
                          </Badge>
                        )}
                        {att.isCampLeader && (
                          <Badge
                            variant="default"
                            className="ml-1 bg-primary text-white"
                          >
                            Ръководител
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-zinc-700 dark:text-zinc-300">
                        {att.campRoom || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {att.campDepositPaid ? (
                          <CheckCircle2
                            className="mx-auto text-emerald-500"
                            size={18}
                          />
                        ) : (
                          <span className="text-zinc-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {att.campRemainderPaid ? (
                          <CheckCircle2
                            className="mx-auto text-emerald-500"
                            size={18}
                          />
                        ) : (
                          <span className="text-zinc-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {att.campInsurancePaid ? (
                          <CheckCircle2
                            className="mx-auto text-emerald-500"
                            size={18}
                          />
                        ) : (
                          <span className="text-zinc-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {att.campMedicalProvided ? (
                          <HeartPulse
                            className="mx-auto text-rose-500"
                            size={18}
                          />
                        ) : (
                          <span className="text-zinc-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
