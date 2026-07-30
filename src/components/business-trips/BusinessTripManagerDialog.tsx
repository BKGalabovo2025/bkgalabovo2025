"use client";

import { FileDown, Pencil, Plus, ShieldAlert, Trash2, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { BusinessTripPdfTemplates } from "@/components/business-trips/BusinessTripPdfTemplates";
import { CreateBusinessTripDialog } from "@/components/business-trips/CreateBusinessTripDialog";
import { TripExpenseDialog } from "@/components/business-trips/TripExpenseDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateShort } from "@/lib/date-utils";
import { businessTripService } from "@/services/business-trip-service";
import { BusinessTrip } from "@/types/business-trip.types";
import { Member } from "@/types/member.types";
import { ScheduleEvent } from "@/types/index";
import { getAllMembers } from "@/services/member-service";

export function BusinessTripManagerDialog({
  open,
  onOpenChange,
  event,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: ScheduleEvent;
}) {
  const [businessTrips, setBusinessTrips] = useState<BusinessTrip[]>([]);
  const [membersDict, setMembersDict] = useState<Record<string, Member>>({});
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showBgnInPdf] = useState(false);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);

  // Редакция
  const [tripToEdit, setTripToEdit] = useState<BusinessTrip | null>(null);
  // Изтриване — ид на командировката, която чака потвърждение
  const [tripPendingDelete, setTripPendingDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedTripForPdf, setSelectedTripForPdf] =
    useState<BusinessTrip | null>(null);
  const [selectedTripForExpense, setSelectedTripForExpense] = useState<
    string | null
  >(null);

  const loadData = async () => {
    try {
      const [tripsData, membersData] = await Promise.all([
        businessTripService.getTripsByEventId(event.id),
        getAllMembers(),
      ]);
      setBusinessTrips(tripsData);

      const dict: Record<string, Member> = {};
      membersData.forEach((m) => {
        if (m.id) dict[m.id] = m;
      });
      setMembersDict(dict);
    } catch {
      toast.error("Грешка при зареждане на данните");
    }
  };

  useEffect(() => {
    if (open) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, event.id]);

  const handlePrintOrder = (trip: BusinessTrip) => {
    setIsGeneratingPdf(true);
    setSelectedTripForPdf(trip);
    setTimeout(() => {
      const el = document.getElementById("pdf-order-template");
      if (el) {
        import("@/lib/html-to-pdf").then((m) => {
          m.generatePdfFromElement(
            el,
            `Нареждане_Командировка_${trip.title}`
          ).finally(() => setIsGeneratingPdf(false));
        });
      }
    }, 100);
  };

  const handlePrintStatement = (trip: BusinessTrip) => {
    setIsGeneratingPdf(true);
    setSelectedTripForPdf(trip);
    setTimeout(() => {
      const el = document.getElementById("pdf-statement-template");
      if (el) {
        import("@/lib/html-to-pdf").then((m) => {
          m.generatePdfFromElement(
            el,
            `Ведомост_${trip.title}`
          ).finally(() => setIsGeneratingPdf(false));
        });
      } else {
        setIsGeneratingPdf(false);
      }
    }, 100);
  };

  const handlePrintFuelReport = (trip: BusinessTrip) => {
    setIsGeneratingPdf(true);
    setSelectedTripForPdf(trip);
    setTimeout(() => {
      const el = document.getElementById("pdf-fuel-report-template");
      if (el) {
        import("@/lib/html-to-pdf").then((m) => {
          m.generatePdfFromElement(
            el,
            `Отчет_Гориво_${trip.title}`
          ).finally(() => setIsGeneratingPdf(false));
        });
      } else {
        setIsGeneratingPdf(false);
      }
    }, 100);
  };

  const handleDelete = async (tripId: string) => {
    setIsDeleting(true);
    try {
      await businessTripService.deleteTrip(tripId);
      toast.success("Командировката е изтрита успешно.");
      setTripPendingDelete(null);
      loadData();
    } catch (error) {
      console.error("Delete trip error:", error);
      toast.error("Грешка при изтриването.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-3xl border-zinc-100 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-medium tracking-wide">
              Командировки: {event.title}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-row items-center justify-between rounded-xl bg-zinc-50/50 p-6 dark:bg-zinc-900/50">
            <div>
              <p className="text-sm font-light text-zinc-400">
                Управление на пътуванията и разходите за това събитие
              </p>
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="rounded-xl bg-blue-600 text-white shadow-none hover:bg-blue-700"
            >
              <UserPlus className="mr-2 size-4" /> Създай нова
            </Button>
          </div>

          <div className="mt-4">
            {businessTrips.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <ShieldAlert className="mx-auto mb-3 size-8 opacity-50" />
                <p>Няма създадени командировки за това събитие.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {businessTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className="flex flex-col gap-4 rounded-xl border border-zinc-100 p-5 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">{trip.title}</p>
                      <p className="text-sm text-zinc-500">
                        До: {trip.destination} (
                        {formatDateShort(trip.startDate)} -{" "}
                        {formatDateShort(trip.endDate)})
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTripForExpense(trip.id!);
                          setIsExpenseDialogOpen(true);
                        }}
                      >
                        <Plus className="mr-2 size-4" /> Разход
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrintOrder(trip)}
                        disabled={isGeneratingPdf}
                      >
                        <FileDown className="mr-2 size-4" /> Нареждане (PDF)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrintStatement(trip)}
                        disabled={isGeneratingPdf}
                      >
                        <FileDown className="mr-2 size-4" /> Ведомост (PDF)
                      </Button>
                      {trip.transportType === "fuel_only" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrintFuelReport(trip)}
                          disabled={isGeneratingPdf}
                        >
                          <FileDown className="mr-2 size-4" /> Отчет гориво (PDF)
                        </Button>
                      )}
                      {/* Редакция */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTripToEdit(trip)}
                      >
                        <Pencil className="mr-2 size-4" /> Редактирай
                      </Button>
                      {/* Изтриване */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                        onClick={() => setTripPendingDelete(trip.id!)}
                      >
                        <Trash2 className="mr-2 size-4" /> Изтрий
                      </Button>
                    </div>

                    {/* Инлайн потвърждение за изтриване */}
                    {tripPendingDelete === trip.id && (
                      <div className="col-span-full flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm dark:border-red-900 dark:bg-red-950">
                        <Trash2 className="size-4 shrink-0 text-red-500" />
                        <p className="flex-1 text-red-700 dark:text-red-300">
                          Сигурни ли сте? Това ще изтрие командировката завинаги от базата данни.
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setTripPendingDelete(null)}
                          disabled={isDeleting}
                        >
                          Отказ
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-600 text-white hover:bg-red-700"
                          onClick={() => handleDelete(trip.id!)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? "Изтриване..." : "Да, изтрий"}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <BusinessTripPdfTemplates
        trip={selectedTripForPdf}
        tournament={null}
        event={event}
        entries={[]}
        membersDict={membersDict}
        showBgn={showBgnInPdf}
      />

      {isCreateDialogOpen && (
        <CreateBusinessTripDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          event={event}
          membersDict={membersDict}
          onSuccess={() => {
            setIsCreateDialogOpen(false);
            loadData();
          }}
        />
      )}

      {/* Диалог за Редакция */}
      {tripToEdit && (
        <CreateBusinessTripDialog
          open={!!tripToEdit}
          onOpenChange={(v) => { if (!v) setTripToEdit(null); }}
          event={event}
          membersDict={membersDict}
          initialData={tripToEdit}
          onSuccess={() => {
            setTripToEdit(null);
            loadData();
          }}
        />
      )}

      {isExpenseDialogOpen && selectedTripForExpense && (
        <TripExpenseDialog
          open={isExpenseDialogOpen}
          onOpenChange={setIsExpenseDialogOpen}
          tripId={selectedTripForExpense}
          siteId={"bkgalabovo"}
        />
      )}
    </>
  );
}
