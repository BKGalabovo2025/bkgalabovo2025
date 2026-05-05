"use client";

import { useState, useTransition } from "react";
import { RankingEntry } from "@/services/ranking-service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Trophy,
  TrendingUp,
  Star,
  Users,
  Award,
  Calendar,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";

const CATEGORY_TABS = [
  { id: "all", label: "Общо" },
  { id: "singles", label: "Единично" },
  { id: "doubles", label: "Двойки" },
  { id: "mixed", label: "Смесени" },
];

function getMedalEmoji(position: number): string {
  if (position === 1) return "🥇";
  if (position === 2) return "🥈";
  if (position === 3) return "🥉";
  return `${position}.`;
}

interface RankingsClientProps {
  initialRankings: RankingEntry[];
}

export default function RankingsClient({
  initialRankings,
}: RankingsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("all");
  const [isPending, startTransition] = useTransition();
  const period = searchParams.get("period") || "all";

  const handlePeriodChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("period");
    } else {
      params.set("period", value);
    }

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  // Филтриране по категория на клиента
  const filteredRankings = (() => {
    if (activeTab === "all") return initialRankings;

    const catLabel =
      activeTab === "singles"
        ? "Единично"
        : activeTab === "doubles"
          ? "Двойки"
          : "Смесени";

    return initialRankings
      .map((r) => {
        const cat = r.categoryBreakdown.find((c) => c.category === catLabel);
        if (!cat) return null;
        return { ...r, totalPoints: cat.points, tournamentsPlayed: cat.played };
      })
      .filter(Boolean)
      .sort((a, b) => (b?.totalPoints ?? 0) - (a?.totalPoints ?? 0))
      .map((r, idx) => ({ ...r!, position: idx + 1 })) as RankingEntry[];
  })();

  const topThree = filteredRankings.slice(0, 3);

  return (
    <div className="space-y-6 relative">
      {isPending && (
        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-50 flex items-center justify-center backdrop-blur-[1px] rounded-xl">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Заглавие */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-yellow-100 dark:bg-yellow-900/30">
            <Trophy className="h-8 w-8 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ранглиста</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Глобално класиране по натрупани точки от всички официални турнири
            </p>
          </div>
        </div>
        <div className="md:ml-auto flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-full md:w-[220px] bg-white dark:bg-zinc-950">
              <SelectValue placeholder="Период" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всички турнири</SelectItem>
              <SelectItem value="year">Текуща година (2026)</SelectItem>
              <SelectItem value="h1">Първо полугодие (Яну-Юни)</SelectItem>
              <SelectItem value="h2">Второ полугодие (Юли-Дек)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {initialRankings.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center text-muted-foreground">
            <Award className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">
              Няма намерени данни за избрания период.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Топ 3 подиум */}
          {topThree.length >= 2 && (
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              {/* 2-ро място */}
              <div className="flex flex-col items-center pt-8">
                <div className="text-4xl mb-2">🥈</div>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 w-full text-center shadow-md border">
                  <p className="font-semibold text-sm truncate">
                    {topThree[1]?.memberName ?? "—"}
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    {topThree[1]?.totalPoints ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">точки</p>
                </div>
              </div>
              {/* 1-во място */}
              <div className="flex flex-col items-center">
                <div className="text-4xl mb-2">🥇</div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 w-full text-center shadow-lg border-2 border-yellow-300 dark:border-yellow-700">
                  <p className="font-bold text-sm truncate">
                    {topThree[0]?.memberName ?? "—"}
                  </p>
                  <p className="text-3xl font-bold mt-1 text-yellow-600">
                    {topThree[0]?.totalPoints ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">точки</p>
                </div>
              </div>
              {/* 3-то място */}
              <div className="flex flex-col items-center pt-12">
                <div className="text-4xl mb-2">🥉</div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 w-full text-center shadow-md border">
                  <p className="font-semibold text-sm truncate">
                    {topThree[2]?.memberName ?? "—"}
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    {topThree[2]?.totalPoints ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">точки</p>
                </div>
              </div>
            </div>
          )}

          {/* Обобщени статистики */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {initialRankings.length}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Класирани играчи
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {initialRankings[0]?.totalPoints ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Макс. точки</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {initialRankings.reduce(
                        (s, r) => s + r.tournamentsPlayed,
                        0
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Участия общо
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {initialRankings.reduce((s, r) => s + r.wins, 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Победи общо</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Пълна ранглиста</CardTitle>
              <CardDescription>
                Натрупани точки по всички официални турнири
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  {CATEGORY_TABS.map((tab) => (
                    <TabsTrigger key={tab.id} value={tab.id}>
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {CATEGORY_TABS.map((tab) => (
                  <TabsContent key={tab.id} value={tab.id}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-14 text-center">#</TableHead>
                          <TableHead>Играч</TableHead>
                          <TableHead className="text-center">Турнири</TableHead>
                          <TableHead className="text-center text-green-600">
                            Победи
                          </TableHead>
                          <TableHead className="text-center text-destructive">
                            Загуби
                          </TableHead>
                          <TableHead className="text-center">
                            % Победи
                          </TableHead>
                          <TableHead className="text-center font-bold">
                            Точки
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRankings.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              className="text-center py-12 text-muted-foreground"
                            >
                              Няма данни за тази категория
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredRankings.map((entry) => {
                            const winRate =
                              entry.wins + entry.losses > 0
                                ? Math.round(
                                    (entry.wins / (entry.wins + entry.losses)) *
                                      100
                                  )
                                : 0;
                            return (
                              <TableRow
                                key={entry.memberId}
                                className={
                                  entry.position === 1
                                    ? "bg-yellow-50/60 dark:bg-yellow-900/10"
                                    : entry.position === 2
                                      ? "bg-slate-50/60 dark:bg-slate-900/10"
                                      : entry.position === 3
                                        ? "bg-orange-50/60 dark:bg-orange-900/10"
                                        : ""
                                }
                              >
                                <TableCell className="text-center text-lg font-bold">
                                  {getMedalEmoji(entry.position)}
                                </TableCell>
                                <TableCell>
                                  <div className="font-semibold">
                                    {entry.memberName}
                                  </div>
                                  {tab.id === "all" &&
                                    entry.categoryBreakdown.length > 0 && (
                                      <div className="flex gap-1 mt-1">
                                        {entry.categoryBreakdown.map((c) => (
                                          <Badge
                                            key={c.category}
                                            variant="secondary"
                                            className="text-[10px] px-1.5 py-0"
                                          >
                                            {c.category}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {entry.tournamentsPlayed}
                                </TableCell>
                                <TableCell className="text-center text-green-600 font-semibold">
                                  {entry.wins}
                                </TableCell>
                                <TableCell className="text-center text-destructive">
                                  {entry.losses}
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                                      <div
                                        className="h-full bg-green-500 rounded-full transition-all"
                                        style={{ width: `${winRate}%` }}
                                      />
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {winRate}%
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge
                                    variant={
                                      entry.position <= 3
                                        ? "default"
                                        : "secondary"
                                    }
                                    className={`font-bold text-base px-3 ${
                                      entry.position === 1
                                        ? "bg-yellow-500 hover:bg-yellow-500"
                                        : entry.position === 2
                                          ? "bg-slate-400 hover:bg-slate-400"
                                          : entry.position === 3
                                            ? "bg-orange-400 hover:bg-orange-400"
                                            : ""
                                    }`}
                                  >
                                    {entry.totalPoints}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Система за точки
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                {[
                  { pos: "🥇 1-во", pts: 100 },
                  { pos: "🥈 2-ро", pts: 70 },
                  { pos: "🥉 3-то", pts: 50 },
                  { pos: "4-то", pts: 35 },
                  { pos: "5-то", pts: 20 },
                  { pos: "6-то", pts: 15 },
                  { pos: "7-мо", pts: 10 },
                  { pos: "Участие", pts: 3 },
                ].map(({ pos, pts }) => (
                  <div
                    key={pos}
                    className="flex justify-between items-center px-3 py-1.5 bg-background rounded border"
                  >
                    <span>{pos}</span>
                    <Badge variant="outline" className="font-mono">
                      {pts} т.
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
