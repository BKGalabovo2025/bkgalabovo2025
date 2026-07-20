"use client";

import { useSearchParams } from "next/navigation";

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
  Phone,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
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

  const [channel, setChannel] = useState<"whatsapp" | "email">("whatsapp");
  const [emailSubject, setEmailSubject] = useState("");
  const [systemTemplate, setSystemTemplate] = useState<"reminder" | "deactivated" | "reservationConfirmation" | null>(null);

  const searchParams = useSearchParams();
  const [resDate, setResDate] = useState("");
  const [resStartTime, setResStartTime] = useState("");
  const [resEndTime, setResEndTime] = useState("");
  const [resLocation, setResLocation] = useState("");

  const loadSystemReservation = (date: string, start: string, end: string, loc: string) => {
    setMessageTemplate(`Здравейте, {ИМЕ}!\n\nУспешно запазихте час на ${date} от ${start} до ${end} за ${loc}.\nОчакваме Ви!`);
    setEmailSubject("Потвърждение за резервация");
    setSystemTemplate("reservationConfirmation");
  };

  useEffect(() => {
    const templateParam = searchParams?.get("template");
    if (templateParam === "reservationConfirmation") {
      setChannel("email");
      const dateStr = searchParams?.get("date");
      const endStr = searchParams?.get("end");
      
      let parsedDate = "";
      let parsedStart = "";
      let parsedEnd = "";
      const parsedLoc = searchParams?.get("loc") || "";
      
      if (dateStr) {
        const d = new Date(dateStr);
        parsedDate = d.toLocaleDateString("bg-BG");
        parsedStart = d.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" });
        setResDate(parsedDate);
        setResStartTime(parsedStart);
      }
      if (endStr) {
        parsedEnd = new Date(endStr).toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" });
        setResEndTime(parsedEnd);
      }
      if (parsedLoc) {
        setResLocation(parsedLoc);
      }
      
      const clientId = searchParams?.get("clientId");
      if (clientId) {
        setSelectedIds(prev => new Set(prev).add(clientId));
      }
      
      loadSystemReservation(parsedDate, parsedStart, parsedEnd, parsedLoc);
    }
  }, [searchParams]);

  useEffect(() => {
    if (systemTemplate === "reservationConfirmation") {
      setMessageTemplate(`Здравейте, {ИМЕ}!\n\nУспешно запазихте час на ${resDate} от ${resStartTime} до ${resEndTime} за ${resLocation}.\nОчакваме Ви!`);
    }
  }, [resDate, resStartTime, resEndTime, resLocation, systemTemplate]);

  const filteredMembers = useMemo(() => {
    let result = members;
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      result = members.filter(
        (m) =>
          m.name.toLowerCase().includes(lowerQ) ||
          m.phone?.toLowerCase().includes(lowerQ) ||
          m.email?.toLowerCase().includes(lowerQ)
      );
    }
    return result;
  }, [members, searchQuery]);

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

        // Store all events, we will filter them in the UI
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
    const validMembers = filteredMembers.filter(m => 
      channel === "whatsapp" ? !!m.phone && m.phone.length > 5 : !!m.email && m.email.includes("@")
    );
    
    const allValidSelected = validMembers.every(m => selectedIds.has(m.id)) && validMembers.length > 0;

    if (allValidSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(validMembers.map((m) => m.id)));
    }
  };

  // eslint-disable-next-line sonarjs/cognitive-complexity
  const handleSendToMember = async (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    if (!member || !user) return;

    if (channel === "whatsapp" && (!member.phone || member.phone.length < 5)) return;
    if (channel === "email" && (!member.email || !member.email.includes("@"))) return;

    setSendingId(member.id);
    try {
      const finalMsg = messageTemplate.replace(
        /{ИМЕ}/g,
        member.firstName || member.name
      );

      if (channel === "whatsapp") {
        const logData = {
          siteId: activeBranch,
          recipientId: member.id,
          recipientName: member.name,
          recipientPhone: member.phone,
          messageText: finalMsg,
          templateUsed: systemTemplate || "custom",
          sentBy: user.uid,
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await marketingService.logMessage(logData as any);

        const encodedMsg = encodeURIComponent(finalMsg);
        let cleanPhone = member.phone!.replace(/\s+/g, "");
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
      } else {
        const logData = {
          siteId: activeBranch,
          recipientId: member.id,
          recipientName: member.name,
          recipientPhone: member.email, // Record email in phone field for history simplicity
          messageText: `Тема: ${emailSubject}\n\n${finalMsg}`,
          templateUsed: systemTemplate || "custom",
          sentBy: user.uid,
        };

        const token = await user.getIdToken();
        const response = await fetch("/api/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            to: member.email,
            subject: emailSubject || "Съобщение от БК Гълъбово",
            template: systemTemplate || "marketing",
            data: {
              memberName: member.firstName || member.name,
              messageText: finalMsg,
              ...(systemTemplate === "reservationConfirmation" ? {
                clientName: member.firstName || member.name,
                startTime: resDate && resStartTime ? `${resDate}T${resStartTime}:00` : new Date().toISOString(),
                endTime: resDate && resEndTime ? `${resDate}T${resEndTime}:00` : new Date().toISOString(),
                courtId: resLocation || "Не е посочено"
              } : {})
            },
          }),
        });

        if (!response.ok) {
           const errData = await response.json().catch(()=>({}));
           throw new Error(errData.error || "Грешка при изпращане на имейл");
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await marketingService.logMessage(logData as any);
        toast.success(`Имейлът до ${member.name} е изпратен успешно!`);
      }

      // Refresh history
      const freshHistory = await marketingService.getHistory(activeBranch);
      setHistory(freshHistory);

      // Optionally remove from selection
      const next = new Set(selectedIds);
      next.delete(member.id);
      setSelectedIds(next);
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || "Възникна грешка при запазване на историята.");
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
    setEmailSubject(`Напомняне за тренировка: ${e.title}`);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loadTournamentTemplate = (t: any) => {
    if (!t) return;
    const dateStr = format(new Date(t.startDate), "dd.MM.yyyy", { locale: bg });
    setMessageTemplate(
      `Здравей, {ИМЕ}!\n\nЗаписването за клубния турнир *${t.title}* е отворено!\n📅 Начало: ${dateStr}\n\nОчакваме те на корта! Успех! 🏆`
    );
    setEmailSubject(`Предстоящ турнир: ${t.title}`);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loadCompetitionTemplate = (c: any) => {
    if (!c) return;
    const dateStr = format(new Date(c.startDate), "dd.MM.yyyy", { locale: bg });
    setMessageTemplate(
      `Здравей, {ИМЕ}!\n\nНапомняме ти за предстоящото състезание: *${c.title}*\n📅 От: ${dateStr}\n📍 ${c.location}\n\nПожелаваме ти успех и силно представяне! 🏸`
    );
    setEmailSubject(`Предстоящо състезание: ${c.title}`);
  };

  const loadRecoveryTemplate = () => {
    setMessageTemplate(
      `Здравей, {ИМЕ}!\n\nСпециално предложение за теб в нашата Зона за Възстановяване! ⚡️\nВъзползвай се от отстъпка за възстановителни процедури през тази седмица.\n\nЗапиши си час още сега!`
    );
    setEmailSubject(`Специална оферта: Зона за възстановяване`);
    setSystemTemplate(null);
  };

  const loadSystemReminder = () => {
    setMessageTemplate(`Здравейте, {ИМЕ}.\n\nНапомняме Ви за просрочено плащане към Бадминтон Клуб Гълъбово.\nМоля, свържете се с нас за повече информация.`);
    setEmailSubject("Напомняне за плащане");
    setSystemTemplate("reminder");
  };

  const loadSystemDeactivated = () => {
    setMessageTemplate(`Здравейте, {ИМЕ}.\n\nУведомяваме Ви, че тъй като нямате активен или платен абонамент през последните 30 дни, статусът на Вашия профил в Бадминтон Клуб Гълъбово е автоматично променен на неактивен (inactive).\n\nЗа да възстановите активния си статус и да продължите да ползвате услугите на клуба, е необходимо да заплатите нов абонамент.\n\nС уважение,\nЕкипът на Бадминтон Клуб Гълъбово`);
    setEmailSubject("Известие за изтекло членство");
    setSystemTemplate("deactivated");
  };

  if (membersLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 inline-flex h-11 w-full max-w-sm rounded-xl bg-muted p-1">
          <TabsTrigger
            value="send"
            className="rounded-lg flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground text-xs tracking-wider uppercase font-semibold"
          >
            <Target className="w-4 h-4 mr-2" /> Изпращане
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-lg flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground text-xs tracking-wider uppercase font-semibold"
          >
            <List className="w-4 h-4 mr-2" /> История
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-3xl border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <MessageCircle className="text-primary w-5 h-5" /> Създаване на съобщение
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">

                <div className="flex bg-muted p-1 rounded-xl w-fit">
                   <button 
                     onClick={() => setChannel("whatsapp")}
                     className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${channel === 'whatsapp' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                   >
                     <Phone className="w-4 h-4 text-emerald-500" /> WhatsApp
                   </button>
                   <button 
                     onClick={() => setChannel("email")}
                     className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${channel === 'email' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                   >
                     <Mail className="w-4 h-4 text-primary" /> Имейл
                   </button>
                </div>
                
                {channel === "email" && (
                  <div className="space-y-1">
                    <Input 
                      placeholder="Тема (Subject)..." 
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      disabled={!!systemTemplate}
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary h-12 rounded-xl text-sm"
                    />
                    {systemTemplate && (
                      <p className="text-xs text-muted-foreground ml-2">Темата е автоматична за системни съобщения.</p>
                    )}
                  </div>
                )}

              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 p-4 rounded-xl flex gap-3 items-start">
                  <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg text-blue-600 dark:text-blue-400 mt-0.5">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed">
                    Използвайте{" "}
                    <code className="bg-white dark:bg-blue-950 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 rounded font-semibold text-blue-700 dark:text-blue-300">
                      {"{ИМЕ}"}
                    </code>{" "}
                    където искате системата автоматично да постави малкото име на получателя.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground">
                      Готови шаблони
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setMessageTemplate("");
                        setEmailSubject("");
                        setSystemTemplate(null);
                      }}
                      className="text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 h-8 text-xs"
                    >
                      Изчисти полетата
                    </Button>
                  </div>
                  
                  <Select
                    value=""
                    onValueChange={(val) => {
                      if (!val) return;
                      const [type, id] = val.split(":");
                      if (type === "training") {
                        const ev = events.find((e) => e.id === id);
                        loadTrainingTemplate(ev);
                        setSystemTemplate(null);
                      } else if (type === "tournament") {
                        const t = tournaments.find((t) => t.id === id);
                        loadTournamentTemplate(t);
                        setSystemTemplate(null);
                      } else if (type === "competition") {
                        const c = events.find((e) => e.id === id);
                        loadCompetitionTemplate(c);
                        setSystemTemplate(null);
                      } else if (type === "reminder") {
                        loadSystemReminder();
                      } else if (type === "deactivated") {
                        loadSystemDeactivated();
                      } else if (type === "reservationConfirmation") {
                        loadSystemReservation(resDate, resStartTime, resEndTime, resLocation);
                      } else if (type === "recovery") {
                        loadRecoveryTemplate();
                        setSystemTemplate(null);
                      }
                    }}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground focus:ring-primary w-full h-11 rounded-xl">
                      <SelectValue placeholder="Изберете готов шаблон за зареждане..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectGroup>
                        <SelectLabel className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Системни Известия</SelectLabel>
                        <SelectItem value="reservationConfirmation:">Потвърждение за резервация</SelectItem>
                        <SelectItem value="reminder:">Напомняне за плащане</SelectItem>
                        <SelectItem value="deactivated:">Известие за неактивен профил</SelectItem>
                      </SelectGroup>
                      
                      {events.filter(e => e.type === "training").length > 0 && (
                        <SelectGroup>
                          <SelectLabel className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-2">Тренировки</SelectLabel>
                          {events.filter(e => e.type === "training").map((ev) => (
                            <SelectItem key={`training:${ev.id}`} value={`training:${ev.id}`}>
                              {ev.title} ({format(new Date(ev.startDate), "dd.MM", { locale: bg })})
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}

                      {(events.filter(e => e.type === "competition").length > 0 || tournaments.length > 0) && (
                        <SelectGroup>
                          <SelectLabel className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-2">Състезания и Турнири</SelectLabel>
                          {events.filter(e => e.type === "competition").map((c) => (
                            <SelectItem key={`competition:${c.id}`} value={`competition:${c.id}`}>
                              {c.title} ({format(new Date(c.startDate), "dd.MM", { locale: bg })})
                            </SelectItem>
                          ))}
                          {tournaments.map((t) => (
                            <SelectItem key={`tournament:${t.id}`} value={`tournament:${t.id}`}>
                              {t.title}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}

                      <SelectGroup>
                        <SelectLabel className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-2">Други</SelectLabel>
                        <SelectItem value="recovery:">Отстъпка за възстановяване</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  {systemTemplate === "reservationConfirmation" && channel === "email" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Дата</label>
                        <Input type="date" value={resDate} onChange={e => setResDate(e.target.value)} className="bg-background" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Корт / Процедура</label>
                        <Input value={resLocation} onChange={e => setResLocation(e.target.value)} placeholder="напр. Корт 1" className="bg-background" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Начален час</label>
                        <Input type="time" value={resStartTime} onChange={e => setResStartTime(e.target.value)} className="bg-background" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Краен час</label>
                        <Input type="time" value={resEndTime} onChange={e => setResEndTime(e.target.value)} className="bg-background" />
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-1">
                    <Textarea
                    value={messageTemplate}
                    onChange={(e) => setMessageTemplate(e.target.value)}
                    placeholder="Въведете вашия текст тук... Здравей, {ИМЕ}!"
                    disabled={!!systemTemplate && channel === "email"}
                    className="min-h-[200px] bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary resize-y rounded-xl p-4 text-sm"
                  />
                  {systemTemplate && channel === "email" && (
                    <p className="text-xs text-rose-500 ml-2">Това поле е заключено, защото системният шаблон за имейл има вграден дизайн.</p>
                  )}
                  {systemTemplate && channel === "whatsapp" && (
                     <p className="text-xs text-primary ml-2">Текстът на системното съобщение е зареден за изпращане по WhatsApp.</p>
                  )}
                  </div>
                </div>
              </div>
              </CardContent>
            </Card>

            {/* Right: Select Members */}
            <Card className="rounded-3xl border-border/50 shadow-sm flex flex-col h-[600px]">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Target className="text-primary w-5 h-5" /> Избор на получатели
                  </CardTitle>
                  <Badge
                    variant="secondary"
                    className="bg-muted text-muted-foreground"
                  >
                    {selectedIds.size} избрани
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden flex flex-col p-0 px-6 pb-6">
                <div className="relative mb-4 shrink-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Търсене по име или телефон..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-background border-border"
                  />
                </div>

                <div className="flex items-center gap-3 px-2 py-3 border-b border-border shrink-0">
                  <button
                    onClick={toggleAll}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <CheckSquare size={18} />
                  </button>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {channel === "whatsapp" ? "Име и телефон" : "Име и имейл"}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 py-2 space-y-1 pr-2">
                  {filteredMembers.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground text-sm">
                      Няма намерени членове.
                    </div>
                  ) : (
                    filteredMembers.map((member) => {
                      const canSend = channel === "whatsapp" 
                        ? Boolean(member.phone && member.phone.length > 5) 
                        : Boolean(member.email && member.email.includes("@"));
                        
                      const contactInfo = channel === "whatsapp" 
                        ? member.phone 
                        : member.email;

                      const reason = channel === "whatsapp" 
                        ? "Няма телефон"
                        : "Няма имейл";

                      let itemClass = "hover:bg-muted border border-transparent";
                      if (!canSend) {
                        itemClass = "opacity-50 bg-muted/50";
                      } else if (selectedIds.has(member.id)) {
                        itemClass = "bg-primary/5 border border-primary/20";
                      }

                      return (
                      <div
                        key={member.id}
                        className={`flex items-center justify-between p-3 rounded-xl transition-all ${itemClass}`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            disabled={!canSend}
                            onClick={() => canSend && toggleMember(member.id)}
                            className={`transition-colors shrink-0 ${canSend ? "text-muted-foreground hover:text-primary cursor-pointer" : "text-muted-foreground/30 cursor-not-allowed"}`}
                          >
                            {selectedIds.has(member.id) && canSend ? (
                              <CheckSquare size={18} className="text-primary" />
                            ) : (
                              <Square size={18} />
                            )}
                          </button>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground flex items-center gap-2">
                              {member.name}
                              {!canSend && (
                                <Badge variant="outline" className="text-[10px] py-0 h-4 border-rose-500/30 text-rose-500 bg-rose-500/10 font-medium">
                                  {reason}
                                </Badge>
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {contactInfo || "-"}
                            </span>
                          </div>
                        </div>

                        {selectedIds.has(member.id) && canSend && (
                          <Button
                            size="sm"
                            disabled={
                              !messageTemplate.trim() || sendingId === member.id || (channel === "email" && !emailSubject.trim())
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
                    )})
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="rounded-3xl border-border/50 shadow-sm min-h-[600px]">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <List className="text-primary w-5 h-5" /> История на съобщенията
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  Все още няма изпратени съобщения от тази система.
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((log) => (
                    <div
                      key={log.id}
                      className="bg-background border border-border rounded-xl p-5 flex flex-col sm:flex-row gap-5"
                    >
                      <div className="sm:w-1/4 shrink-0 border-r border-border pr-4">
                        <div className="text-sm font-bold text-foreground mb-1">
                          {log.recipientName}
                        </div>
                        <div className="text-xs font-mono text-muted-foreground mb-3">
                          {log.recipientPhone}
                        </div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          {format(new Date(log.sentAt), "dd MMM yyyy, HH:mm", {
                            locale: bg,
                          })}
                        </div>
                      </div>
                      <div className="sm:w-3/4">
                        <div className="bg-muted/50 text-foreground text-sm p-4 rounded-lg whitespace-pre-wrap border border-border/50">
                          {log.messageText}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
