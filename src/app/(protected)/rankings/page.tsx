"use client";

import { useState, useEffect } from "react";
import { computeGlobalRankings, RankingEntry } from "@/services/ranking-service";
import { getAllMembers } from "@/services/member-service";
import { Member } from "@/types/member.types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, TrendingUp, Star, Users, Award, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

export default function RankingsPage() {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [membersDict, setMembersDict] = useState<Record<string, Member>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [period, setPeriod] = useState("all");

  useEffect(() => {
    loadData(period);
  }, [period]);

  const getPeriodFilter = (p: string) => {
    const now = new Date();
    const year = now.getFullYear();
    switch (p) {
      case "year":
        return { start: new Date(year, 0, 1), end: new Date(year, 11, 31, 23, 59, 59) };
      case "h1":
        return { start: new Date(year, 0, 1), end: new Date(year, 5, 30, 23, 59, 59) };
      case "h2":
        return { start: new Date(year, 6, 1), end: new Date(year, 11, 31, 23, 59, 59) };
      default:
        return undefined;
    }
  };

  const loadData = async (p: string) => {
    setLoading(true);
    try {
      const filter = getPeriodFilter(p);
      const [rankingsData, membersData] = await Promise.all([
        computeGlobalRankings(filter),
        getAllMembers(),
      ]);

      const dict: Record<string, Member> = {};
      membersData.forEach(m => {
        if (m.id) dict[m.id] = m;
      });

      // Замени memberId с истинското им пълно име
      const enriched = rankingsData.map(r => ({
        ...r,
        memberName:
          dict[r.memberId]
            ? `${dict[r.memberId].firstName} ${dict[r.memberId].lastName}`
            : r.memberName,
      }));

      setRankings(enriched);
      setMembersDict(dict);
    } catch (error) {
      console.error("Error loading rankings:", error);
    } finally {
      setLoading(false);
    }
  };

  // Филтриране по категория
  const filteredRankings = (() => {
    if (activeTab === "all") return rankings;

    const catLabel =
      activeTab === "singles" ? "Единично"
      : activeTab === "doubles" ? "Двойки"
      : "Смесени";

    return rankings
      .map(r => {
        const cat = r.categoryBreakdown.find(c => c.category === catLabel);
        if (!cat) return null;
        return { ...r, totalPoints: cat.points, tournamentsPlayed: cat.played };
      })
      .filter(Boolean)
      .sort((a, b) => (b?.totalPoints ?? 0) - (a?.totalPoints ?? 0))
      .map((r, idx) => ({ ...r!, position: idx + 1 })) as RankingEntry[];
  })();

  const topThree = filteredRankings.slice(0, 3);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-48 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 animate-in fade-in duration-700">
        <Trophy className="h-16 w-16 text-yellow-500 animate-bounce mb-6" />
        <h2 className="text-2xl font-bold font-heading text-zinc-900 dark:text-white">Изчисляване на ранглистата...</h2>
        <p className="text-zinc-500 mt-2 font-medium">Моля изчакайте, докато анализираме всички резултати.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Заглавие */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight font-heading text-zinc-900 dark:text-white flex items-center gap-3">
            <Trophy className="h-10 w-10 text-yellow-500" />
            Ранглиста
          </h1>
          <p className="text-muted-foreground text-lg">
            Глобално класиране по натрупани точки от всички официални турнири.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-700">
          <Calendar className="h-4 w-4 text-zinc-500 ml-2" />
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px] h-9 border-none bg-transparent shadow-none focus:ring-0 font-bold text-sm">
              <SelectValue placeholder="Период" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-xl">
              <SelectItem value="all">Всичко</SelectItem>
              <SelectItem value="year">Текуща година (2026)</SelectItem>
              <SelectItem value="h1">Първо полугодие (Яну-Юни)</SelectItem>
              <SelectItem value="h2">Второ полугодие (Юли-Дек)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {rankings.length === 0 ? (
        <Card className="rounded-3xl border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <CardContent className="py-32 text-center">
            <Award className="h-20 w-20 mx-auto mb-6 text-zinc-200" />
            <h3 className="text-2xl font-bold font-heading">Все още няма данни</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto text-lg font-medium">
              Завършете поне един официален турнир, за да започнем да следим вашите постижения.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Топ 3 подиум */}
          {topThree.length >= 2 && (
            <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto pt-12 pb-8 relative">
              {/* Decorative Background Elements */}
              <div className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-800 to-transparent rounded-full opacity-50" />
              
              {/* 2-ро място */}
              <div className="flex flex-col items-center justify-end h-full">
                <div className="text-5xl mb-4 drop-shadow-lg">🥈</div>
                <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl p-5 w-full text-center shadow-xl border border-zinc-100 dark:border-zinc-800 relative z-10 hover:-translate-y-1 transition-all">
                  <div className="h-1.5 w-12 bg-zinc-300 dark:bg-zinc-600 rounded-full mx-auto mb-3" />
                  <p className="font-bold text-sm truncate font-heading">{topThree[1]?.memberName ?? "—"}</p>
                  <p className="text-3xl font-black mt-2 text-zinc-700 dark:text-zinc-300">{topThree[1]?.totalPoints ?? 0}</p>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">точки</p>
                </div>
              </div>

              {/* 1-во място */}
              <div className="flex flex-col items-center justify-end h-full transform scale-110">
                <div className="text-6xl mb-4 drop-shadow-2xl animate-pulse">🥇</div>
                <div className="bg-gradient-to-b from-yellow-50 to-white dark:from-yellow-900/20 dark:to-zinc-900/80 backdrop-blur-md rounded-2xl p-6 w-full text-center shadow-2xl border-2 border-yellow-200 dark:border-yellow-700/50 relative z-20 hover:-translate-y-2 transition-all">
                  <div className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-500"></span>
                  </div>
                  <div className="h-2 w-16 bg-yellow-400 rounded-full mx-auto mb-4" />
                  <p className="font-black text-base truncate font-heading text-zinc-900 dark:text-white">{topThree[0]?.memberName ?? "—"}</p>
                  <p className="text-4xl font-black mt-2 text-yellow-600">{topThree[0]?.totalPoints ?? 0}</p>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-yellow-600/70">точки</p>
                </div>
              </div>

              {/* 3-то място */}
              <div className="flex flex-col items-center justify-end h-full">
                <div className="text-5xl mb-4 drop-shadow-lg">🥉</div>
                <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl p-5 w-full text-center shadow-xl border border-zinc-100 dark:border-zinc-800 relative z-10 hover:-translate-y-1 transition-all">
                  <div className="h-1.5 w-12 bg-orange-300 dark:bg-orange-900/60 rounded-full mx-auto mb-3" />
                  <p className="font-bold text-sm truncate font-heading">{topThree[2]?.memberName ?? "—"}</p>
                  <p className="text-3xl font-black mt-2 text-orange-700 dark:text-orange-400">{topThree[2]?.totalPoints ?? 0}</p>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">точки</p>
                </div>
              </div>
            </div>
          )}

          {/* Обобщени статистики */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Users, label: "Класирани", val: rankings.length, color: "blue" },
              { icon: TrendingUp, label: "Макс. точки", val: rankings[0]?.totalPoints ?? 0, color: "emerald" },
              { icon: Trophy, label: "Участия", val: rankings.reduce((s, r) => s + r.tournamentsPlayed, 0), color: "yellow" },
              { icon: Star, label: "Победи", val: rankings.reduce((s, r) => s + r.wins, 0), color: "purple" }
            ].map((stat, i) => (
              <Card key={i} className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all group">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-${stat.color}-50 dark:bg-${stat.color}-900/20 text-${stat.color}-600 dark:text-${stat.color}-400 group-hover:scale-110 transition-transform`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-black font-heading text-zinc-900 dark:text-white leading-none">{stat.val}</p>
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-tighter mt-1">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Таблица по категории */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold font-heading">Пълна ранглиста</h2>
                <p className="text-muted-foreground font-medium text-sm">Подробни резултати и статистики за всички играчи.</p>
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                <TabsList className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-1 h-11 border border-zinc-200 dark:border-zinc-700 shadow-inner">
                  {CATEGORY_TABS.map(tab => (
                    <TabsTrigger key={tab.id} value={tab.id} className="rounded-xl px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 font-bold font-heading transition-all">{tab.label}</TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <Card className="rounded-3xl overflow-hidden border-zinc-200 dark:border-zinc-800 shadow-xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md">
              <Table>
                <TableHeader className="bg-zinc-50 dark:bg-zinc-800/50">
                  <TableRow className="border-zinc-200 dark:border-zinc-800 hover:bg-transparent">
                    <TableHead className="w-16 text-center font-bold text-zinc-500 uppercase text-[10px] tracking-widest">#</TableHead>
                    <TableHead className="font-bold text-zinc-500 uppercase text-[10px] tracking-widest">Играч</TableHead>
                    <TableHead className="text-center font-bold text-zinc-500 uppercase text-[10px] tracking-widest">Турнири</TableHead>
                    <TableHead className="text-center font-bold text-emerald-600 uppercase text-[10px] tracking-widest">Победи</TableHead>
                    <TableHead className="text-center font-bold text-red-500 uppercase text-[10px] tracking-widest">Загуби</TableHead>
                    <TableHead className="text-center font-bold text-zinc-500 uppercase text-[10px] tracking-widest">% Победи</TableHead>
                    <TableHead className="text-right pr-8 font-bold text-zinc-900 dark:text-white uppercase text-[10px] tracking-widest">Точки</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRankings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-24 text-muted-foreground font-medium">
                        Няма данни за избраната категория и период.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRankings.map((entry) => {
                      const winRate = entry.wins + entry.losses > 0
                        ? Math.round((entry.wins / (entry.wins + entry.losses)) * 100)
                        : 0;
                      
                      const isTopThree = entry.position <= 3;
                      
                      return (
                        <TableRow
                          key={entry.memberId}
                          className={`group transition-all border-zinc-100 dark:border-zinc-800 ${
                            entry.position === 1 ? "bg-yellow-50/30 dark:bg-yellow-900/5" :
                            entry.position === 2 ? "bg-zinc-50/40 dark:bg-zinc-800/10" :
                            entry.position === 3 ? "bg-orange-50/30 dark:bg-orange-900/5" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                          }`}
                        >
                          <TableCell className="text-center">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-black font-heading ${
                              entry.position === 1 ? "text-2xl" :
                              entry.position === 2 ? "text-xl text-zinc-500" :
                              entry.position === 3 ? "text-xl text-orange-500" : "text-sm text-zinc-400"
                            }`}>
                              {getMedalEmoji(entry.position)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="font-bold text-zinc-900 dark:text-zinc-100 font-heading group-hover:translate-x-1 transition-transform">{entry.memberName}</div>
                            <div className="flex gap-1.5 mt-1.5">
                              {entry.categoryBreakdown.map(c => (
                                <Badge key={c.category} variant="outline" className="text-[9px] px-1.5 py-0 font-bold uppercase tracking-tighter border-zinc-200 dark:border-zinc-700 text-zinc-400">
                                  {c.category}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-bold text-zinc-600 dark:text-zinc-400">{entry.tournamentsPlayed}</TableCell>
                          <TableCell className="text-center text-emerald-600 font-black">{entry.wins}</TableCell>
                          <TableCell className="text-center text-red-500/60">{entry.losses}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-3">
                              <div className="w-20 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden shadow-inner border border-zinc-200/50 dark:border-zinc-700/50">
                                <div
                                  className={`h-full rounded-full transition-all duration-1000 ${
                                    winRate >= 70 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
                                    winRate >= 40 ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-zinc-400"
                                  }`}
                                  style={{ width: `${winRate}%` }}
                                />
                              </div>
                              <span className="text-xs font-black text-zinc-500 w-8">{winRate}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            <Badge
                              className={`font-black text-lg px-4 py-1.5 rounded-xl shadow-lg transition-transform group-hover:scale-110 ${
                                entry.position === 1 ? "bg-yellow-500 hover:bg-yellow-600 text-white shadow-yellow-200 dark:shadow-none" :
                                entry.position === 2 ? "bg-zinc-400 hover:bg-zinc-500 text-white shadow-zinc-200 dark:shadow-none" :
                                entry.position === 3 ? "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200 dark:shadow-none" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-none hover:bg-zinc-200"
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
            </Card>
          </div>

          {/* Легенда за точки */}
          <Card className="rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/50 border-none shadow-inner overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                <div className="h-1 w-8 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
                Система за точки
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 text-sm">
                {[
                  { pos: "🥇", pts: 100, label: "1-во" },
                  { pos: "🥈", pts: 70, label: "2-ро" },
                  { pos: "🥉", pts: 50, label: "3-то" },
                  { pos: "4.", pts: 35, label: "4-то" },
                  { pos: "5.", pts: 20, label: "5-то" },
                  { pos: "6.", pts: 15, label: "6-то" },
                  { pos: "7.", pts: 10, label: "7-мо" },
                  { pos: "🏃", pts: 3, label: "Участие" },
                ].map(({ pos, pts, label }) => (
                  <div key={label} className="flex flex-col items-center p-3 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 shadow-sm hover:shadow-md transition-all">
                    <span className="text-xl mb-1">{pos}</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">{label}</span>
                    <span className="text-base font-black text-zinc-900 dark:text-white mt-1">{pts}<span className="text-[10px] ml-0.5 text-zinc-400">т.</span></span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-center gap-3 text-xs font-bold text-zinc-400 uppercase tracking-widest italic">
                <TrendingUp className="h-4 w-4" />
                Точките се умножават по коефициента на турнира
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
