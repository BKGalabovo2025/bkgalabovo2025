"use client";

import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { bg } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Activity,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

import { Timestamp } from "firebase/firestore";
import { useAppStore } from "@/store/use-app-store";
import { useMembers } from "@/hooks/useMembers";
import { useReservations } from "@/hooks/useReservations";
import { useAvailability } from "@/hooks/useAvailability";
import { usePackages } from "@/hooks/usePackages";
import { getAllClubServices } from "@/services/club-service";
import { ClubService } from "@/types";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RecoveryPage() {
  const { activeBranch, setActiveBranch } = useAppStore();

  React.useEffect(() => {
    setActiveBranch("recoveryzone");
  }, [setActiveBranch]);

  const { members } = useMembers();

  const [date, setDate] = useState<Date>(new Date());
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [services, setServices] = useState<ClubService[]>([]);

  // Hooks for booking logic
  const { reservations, addReservation } = useReservations(activeBranch, date);
  const {
    availableSlots,
    isLoading: isAvailLoading,
    service,
    site,
  } = useAvailability(activeBranch, selectedServiceId, date);

  const { packages, deductSession } = usePackages(selectedMemberId);

  const activePackage = useMemo(() => {
    if (!selectedServiceId) return null;
    return packages.find(
      (p) =>
        p.serviceId === selectedServiceId &&
        p.sessionsRemaining > 0 &&
        p.status === "active"
    );
  }, [packages, selectedServiceId]);

  // Load services on mount
  React.useEffect(() => {
    getAllClubServices().then((data: ClubService[]) => {
      const bookingServices = data.filter((s: ClubService) => s.requiresBooking);
      setServices(bookingServices);
      if (bookingServices.length > 0 && !selectedServiceId) {
        setSelectedServiceId(bookingServices[0].id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBooking = async (slotTime: Date) => {
    if (!selectedMemberId || !service || !activeBranch) {
      toast.error("Моля изберете член и услуга");
      return;
    }

    const member = members.find((m) => m.id === selectedMemberId);
    if (!member) return;

    try {
      const endTime = new Date(
        slotTime.getTime() + (service.durationMinutes || 0) * 60000
      );

      await addReservation({
        siteId: activeBranch,
        clientId: member.id,
        clientName: member.name,
        clientPhone: member.phone || "",
        clientEmail: member.email || "",
        serviceId: service.id,
        serviceName: service.name,
        startTime: Timestamp.fromDate(slotTime),
        endTime: Timestamp.fromDate(endTime),
        clientStartTime: Timestamp.fromDate(slotTime),
        clientEndTime: Timestamp.fromDate(endTime),
        status: "scheduled",
        usedResources: service.requiredResources || {
          attachments: {},
          compressors: 0,
        },
        isExclusive: service.isExclusive,
        bufferAfter: service.bufferAfter,
        notes: "",
        price: service.price || 0,
        finalPrice: service.price || 0,
      });

      if (activePackage) {
        const success = await deductSession(activePackage.id);
        if (success) {
          toast.success("Използвано е посещение от пакет");
        }
      }

      toast.success("Резервацията е успешно създадена");
    } catch (err) {
      console.error(err);
    }
  };

  const currentReservations = useMemo(() => {
    return reservations.filter((r) => r.status !== "cancelled");
  }, [reservations]);

  const renderSlotsContent = () => {
    if (isAvailLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="size-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!site?.recoveryEnabled) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 py-20 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <AlertCircle className="size-8 text-amber-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">
              Възстановителната зона не е активна
            </h3>
            <p className="max-w-sm text-muted-foreground">
              За избрания обект ({activeBranch}) в момента няма
              конфигурирана активна възстановителна зона.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {availableSlots.map((slot, i) => (
          <Button
            key={i}
            variant={slot.available ? "outline" : "ghost"}
            disabled={!slot.available}
            className={cn(
              "flex h-14 flex-col items-center justify-center gap-1 transition-all",
              slot.available
                ? "hover:border-primary hover:bg-primary/5 active:scale-95"
                : "cursor-not-allowed opacity-40 grayscale"
            )}
            onClick={() => handleBooking(slot.start)}
          >
            <div className="flex items-center gap-2 font-semibold">
              <Clock className="size-3" />
              {slot.time}
            </div>
            {slot.available && (
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                Свободно
              </span>
            )}
          </Button>
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 space-y-6 bg-zinc-50/50 p-8 pt-6 dark:bg-zinc-950/50">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="bg-linear-to-r from-zinc-900 to-zinc-500 bg-clip-text text-3xl font-bold tracking-tight text-transparent dark:from-white dark:to-zinc-400">
            Възстановяване & Релакс
          </h2>
          <p className="text-muted-foreground">
            Управление на резервации за възстановителни процедури в{" "}
            {activeBranch}.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Left Column: Selection & Calendar */}
        <div className="space-y-6 md:col-span-4">
          <Card className="border-none bg-white/80 shadow-xl shadow-zinc-200/50 backdrop-blur-xl dark:bg-zinc-900/80 dark:shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarIcon className="size-5 text-primary" />
                Настройки на резервацията
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Дата</label>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  className="rounded-md border shadow-sm"
                  locale={bg}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Услуга</label>
                <Select
                  value={selectedServiceId}
                  onValueChange={setSelectedServiceId}
                >
                  <SelectTrigger className="bg-white dark:bg-zinc-800">
                    <SelectValue placeholder="Изберете услуга" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.durationMinutes} мин)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Член на клуба</label>
                <Select
                  value={selectedMemberId}
                  onValueChange={setSelectedMemberId}
                >
                  <SelectTrigger className="bg-white dark:bg-zinc-800">
                    <SelectValue placeholder="Изберете член" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedMemberId && (
                <div className="space-y-3 border-t pt-4">
                  <h4 className="flex items-center gap-2 text-sm font-semibold">
                    <Activity className="size-4 text-emerald-500" />
                    Активни пакети
                  </h4>
                  {packages.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      Няма активни пакети за този член.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {packages.map((pkg) => (
                        <div
                          key={pkg.id}
                          className={cn(
                            "flex items-center justify-between rounded-lg border p-2 text-sm",
                            pkg.sessionsRemaining > 0
                              ? "border-emerald-100 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/10"
                              : "border-zinc-100 bg-zinc-50 opacity-60"
                          )}
                        >
                          <div>
                            <p className="font-medium">{pkg.serviceName}</p>
                            <p className="text-xs text-muted-foreground">
                              Оставащи: {pkg.sessionsRemaining} от{" "}
                              {pkg.totalSessions}
                            </p>
                          </div>
                          {pkg.sessionsRemaining > 0 && (
                            <Badge className="bg-emerald-500 hover:bg-emerald-600">
                              Активен
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Reservations Stats */}
          <Card className="border-none bg-primary/5 shadow-lg dark:bg-primary/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Резервации за деня
                  </p>
                  <p className="text-2xl font-bold">
                    {currentReservations.length}
                  </p>
                </div>
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                  <Activity className="size-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Time Slots & Existing Bookings */}
        <div className="space-y-6 md:col-span-8">
          <Card className="min-h-150 border-none bg-white/80 shadow-xl backdrop-blur-xl dark:bg-zinc-900/80">
            <Tabs defaultValue="available" className="w-full">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                <div>
                  <CardTitle>График</CardTitle>
                  <CardDescription>
                    {format(date, "EEEE, d MMMM yyyy", { locale: bg })}
                  </CardDescription>
                </div>
                <TabsList className="grid w-full max-w-100 grid-cols-2">
                  <TabsTrigger value="available">Свободни часове</TabsTrigger>
                  <TabsTrigger value="existing">Резервации</TabsTrigger>
                </TabsList>
              </CardHeader>

              <TabsContent value="available" className="p-6">
                {renderSlotsContent()}
              </TabsContent>

              <TabsContent value="existing" className="p-0">
                <ScrollArea className="h-125">
                  <div className="space-y-4 p-6">
                    {currentReservations.length === 0 ? (
                      <div className="py-20 text-center text-muted-foreground">
                        <AlertCircle className="mx-auto mb-4 size-10 opacity-20" />
                        <p>Няма направени резервации за тази дата.</p>
                      </div>
                    ) : (
                      currentReservations.map((res) => (
                        <div
                          key={res.id}
                          className="group flex items-center justify-between rounded-xl border bg-white p-4 transition-all hover:shadow-md dark:bg-zinc-800/50"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex size-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-700">
                              <User className="size-5 text-zinc-500" />
                            </div>
                            <div>
                              <p className="font-semibold">{res.clientName}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge
                                  variant="secondary"
                                  className="font-normal"
                                >
                                  {res.serviceName}
                                </Badge>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="size-3" />
                                  {format(
                                    res.startTime.toDate(),
                                    "HH:mm"
                                  )} - {format(res.endTime.toDate(), "HH:mm")}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="border-none bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              Потвърдена
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 transition-opacity group-hover:opacity-100"
                            >
                              <ChevronRight className="size-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
