"use client";

import React, { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { bg } from "date-fns/locale";
import {
  MessageCircle,
  Search,
  CheckSquare,
  Square,
  AlertCircle,
  Send,
  Loader2,
  List,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMembers } from "@/hooks/useMembers";
import { marketingService } from "@/services/marketing-service";
import { MarketingLog } from "@/types/marketing.types";
import { useAppStore } from "@/store/use-app-store";
import { useAuth } from "@/context/auth-context";
import { getEventsForPeriod } from "@/services/schedule-service";
import { tournamentService } from "@/services/tournament-service";

export default function MarketingClient() {
  const { activeBranch } = useAppStore();
  const { user } = useAuth();
  const { members, loading: membersLoading } = useMembers();
  const [activeTab, setActiveTab] = useState("send");
  const [searchQuery, setSearchQuery] = useState("");

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Message composing
  const [messageTemplate, setMessageTemplate] = useState("");

  // Async data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [events, setEvents] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [history, setHistory] = useState<MarketingLog[]>([]);

  // Sending state
  const [sendingId, setSendingId] = useState<string | null>(null);

  // Filter members that have a phone number
  const membersWithPhone = useMemo(() => {
    return members.filter((m) => !!m.phone && m.phone.length > 5);
  }, [members]);

  const filteredMembers = useMemo(() => {
    if (!searchQuery) return membersWithPhone;
    const lowerQ = searchQuery.toLowerCase();
    return membersWithPhone.filter(
      (m) =>
        m.name.toLowerCase().includes(lowerQ) ||
        m.phone?.toLowerCase().includes(lowerQ)
    );
  }, [membersWithPhone, searchQuery]);

  // Load events & history
  useEffect(() => {
    const fetchData = async () => {
      try {
        const start = new Date();
        const end = new Date();
        end.setDate(end.getDate() + 30); // next 30 days

        const [fetchedEvents, fetchedTournaments, fetchedHistory] =
          await Promise.all([
            getEventsForPeriod(start, end),
            tournamentService.getTournaments(),
            marketingService.getHistory(activeBranch),
          ]);

        // Filter events for the current branch
        setEvents(fetchedEvents);
        setTournaments(fetchedTournaments);
        setHistory(fetchedHistory);
      } catch (err) {
        console.error("Error loading marketing data", err);
      }
    };
    fetchData();
  }, [activeBranch]);

  const toggleMember = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredMembers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMembers.map((m) => m.id)));
    }
  };

  const handleSendToMember = async (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    if (!member || !member.phone || !user) return;

    setSendingId(member.id);
    try {
      const finalMsg = messageTemplate.replace(
        /{ИМЕ}/g,
        member.firstName || member.name
      );

      // 1. Log to database
      const logData = {
        siteId: activeBranch,
        recipientId: member.id,
        recipientName: member.name,
        recipientPhone: member.phone,
        messageText: finalMsg,
        templateUsed: "custom", // can be refined
        sentBy: user.uid,
      };

      await marketingService.logMessage(logData);

      // 2. Open WhatsApp Web link
      const encodedMsg = encodeURIComponent(finalMsg);
      // Clean phone: replace leading 0 with 359, remove spaces
      let cleanPhone = member.phone.replace(/\s+/g, "");
      if (cleanPhone.startsWith("0")) {
        cleanPhone = "359" + cleanPhone.substring(1);
      } else if (!cleanPhone.startsWith("+") && !cleanPhone.startsWith("359")) {
        cleanPhone = "359" + cleanPhone;
      }
      cleanPhone = cleanPhone.replace("+", "");

      const url = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
      window.open(url, "_blank");

      toast.success(
        `Съобщението до ${member.name} е генерирано и записано в историята!`
      );

      // Refresh history
      const freshHistory = await marketingService.getHistory(activeBranch);
      setHistory(freshHistory);

      // Optionally remove from selection
      const next = new Set(selectedIds);
      next.delete(member.id);
      setSelectedIds(next);
    } catch {
      toast.error("Възникна грешка при запазване на историята.");
    } finally {
      setSendingId(null);
    }
  };

  // Templates
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loadTrainingTemplate = (e: any) => {
    if (!e) return;
    const dateStr = format(
      new Date(e.startDate),
      "dd.MM.yyyy (EEEE) 'от' HH:mm",
      { locale: bg }
    );
    setMessageTemplate(
      `Здравей, {ИМЕ}!\n\nНапомняме ти за предстоящата тренировка: *${e.title}*\n📅 ${dateStr} ч.\n📍 ${e.location || "Спортна зала Енергетик"}\n\nЩе те очакваме! 🏸`
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loadTournamentTemplate = (t: any) => {
    if (!t) return;
    const dateStr = format(new Date(t.startDate), "dd.MM.yyyy", { locale: bg });
    setMessageTemplate(
      `Здравей, {ИМЕ}!\n\nЗаписването за турнира *${t.name}* е отворено!\n📅 Начало: ${dateStr}\n\nОчакваме те на корта! Успех! 🏆`
    );
  };

  const loadRecoveryTemplate = () => {
    setMessageTemplate(
      `Здравей, {ИМЕ}!\n\nСпециално предложение за теб в нашата Зона за Възстановяване! ⚡️\nВъзползвай се от отстъпка за възстановителни процедури през тази седмица.\n\nЗапиши си час още сега!`
    );
  };

  if (membersLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 min-h-screen text-zinc-200 p-6 rounded-3xl border border-zinc-800 shadow-xl">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-zinc-900 border-zinc-800 p-1 mb-8 inline-flex h-12 w-full max-w-sm rounded-xl">
          <TabsTrigger
            value="send"
            className="rounded-lg flex-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-xs tracking-wider uppercase font-semibold"
          >
            <Target className="w-4 h-4 mr-2" /> Изпращане
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-lg flex-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-xs tracking-wider uppercase font-semibold"
          >
            <List className="w-4 h-4 mr-2" /> История
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Compose Message */}
            <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                <MessageCircle className="text-primary" /> Създаване на
                съобщение
              </h3>

              <div className="space-y-4">
                <div className="bg-blue-900/10 border border-blue-900/30 p-4 rounded-xl">
                  <p className="text-xs text-blue-300 font-medium">
                    💡 Използвайте{" "}
                    <code className="bg-blue-950 px-1 py-0.5 rounded text-white">
                      {"{ИМЕ}"}
                    </code>{" "}
                    където искате системата автоматично да постави малкото име
                    на получателя.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                    Готови Шаблони
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {/* Event Selects */}
                    <div className="w-full grid grid-cols-2 gap-2 mb-2">
                      <select
                        className="bg-zinc-950 border border-zinc-800 rounded-lg text-sm p-2 w-full text-zinc-300 outline-none focus:border-primary"
                        onChange={(e) =>
                          loadTrainingTemplate(
                            events.find((ev) => ev.id === e.target.value)
                          )
                        }
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Напомняне за тренировка...
                        </option>
                        {events.map((ev) => (
                          <option key={ev.id} value={ev.id}>
                            {ev.title} (
                            {format(new Date(ev.startDate), "dd.MM", {
                              locale: bg,
                            })}
                            )
                          </option>
                        ))}
                      </select>

                      <select
                        className="bg-zinc-950 border border-zinc-800 rounded-lg text-sm p-2 w-full text-zinc-300 outline-none focus:border-primary"
                        onChange={(e) =>
                          loadTournamentTemplate(
                            tournaments.find((t) => t.id === e.target.value)
                          )
                        }
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Напомняне за турнир...
                        </option>
                        {tournaments.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadRecoveryTemplate}
                      className="bg-zinc-950 border-zinc-800 text-zinc-300 hover:text-emerald-400"
                    >
                      Отстъпка за възстановяване
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMessageTemplate("")}
                      className="bg-zinc-950 border-zinc-800 text-rose-400 hover:text-rose-300"
                    >
                      Изчисти
                    </Button>
                  </div>
                </div>

                <Textarea
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  placeholder="Въведете вашия текст тук... Здравей, {ИМЕ}!"
                  className="min-h-[200px] bg-zinc-950 border-zinc-800 resize-y rounded-xl p-4 text-sm"
                />
              </div>
            </div>

            {/* Right: Select Members */}
            <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 flex flex-col h-[600px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                  <Target className="text-primary" /> Избор на получатели
                </h3>
                <Badge
                  variant="secondary"
                  className="bg-zinc-800 text-zinc-300"
                >
                  {selectedIds.size} избрани
                </Badge>
              </div>

              <div className="relative mb-4 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  placeholder="Търсене по име или телефон..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-zinc-950 border-zinc-800"
                />
              </div>

              <div className="flex items-center gap-3 px-2 py-3 border-b border-zinc-800 shrink-0">
                <button
                  onClick={toggleAll}
                  className="text-zinc-400 hover:text-primary transition-colors"
                >
                  {selectedIds.size === filteredMembers.length &&
                  filteredMembers.length > 0 ? (
                    <CheckSquare size={18} />
                  ) : (
                    <Square size={18} />
                  )}
                </button>
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Име и телефон
                </span>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 py-2 space-y-1 pr-2">
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-10 text-zinc-500 text-sm">
                    Няма намерени членове с въведен телефон.
                  </div>
                ) : (
                  filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      className={`flex items-center justify-between p-3 rounded-xl transition-all ${selectedIds.has(member.id) ? "bg-primary/5 border border-primary/20" : "hover:bg-zinc-800/50 border border-transparent"}`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleMember(member.id)}
                          className="text-zinc-400 hover:text-primary transition-colors shrink-0"
                        >
                          {selectedIds.has(member.id) ? (
                            <CheckSquare size={18} className="text-primary" />
                          ) : (
                            <Square size={18} />
                          )}
                        </button>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white">
                            {member.name}
                          </span>
                          <span className="text-xs text-zinc-500 font-mono">
                            {member.phone}
                          </span>
                        </div>
                      </div>

                      {selectedIds.has(member.id) && (
                        <Button
                          size="sm"
                          disabled={
                            !messageTemplate.trim() || sendingId === member.id
                          }
                          onClick={() => handleSendToMember(member.id)}
                          className="h-8 gap-1.5 shrink-0"
                        >
                          {sendingId === member.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          Изпрати
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 min-h-[600px]">
            <h3 className="text-xl font-bold flex items-center gap-2 text-white mb-6">
              <List className="text-primary" /> История на съобщенията
            </h3>

            {history.length === 0 ? (
              <div className="text-center py-20 text-zinc-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                Все още няма изпратени съобщения от тази система.
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((log) => (
                  <div
                    key={log.id}
                    className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 flex flex-col sm:flex-row gap-5"
                  >
                    <div className="sm:w-1/4 shrink-0 border-r border-zinc-800/50 pr-4">
                      <div className="text-sm font-bold text-white mb-1">
                        {log.recipientName}
                      </div>
                      <div className="text-xs font-mono text-zinc-400 mb-3">
                        {log.recipientPhone}
                      </div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                        {format(new Date(log.sentAt), "dd MMM yyyy, HH:mm", {
                          locale: bg,
                        })}
                      </div>
                    </div>
                    <div className="sm:w-3/4">
                      <div className="bg-blue-900/10 text-zinc-300 text-sm p-4 rounded-lg whitespace-pre-wrap border border-blue-900/20">
                        {log.messageText}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
