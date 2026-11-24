import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { TripDetailsProvider } from "@/components/business-trips/details/TripDetailsContext";
import { TripExpensesView } from "@/components/business-trips/details/views/TripExpensesView";
import { TripOverviewView } from "@/components/business-trips/details/views/TripOverviewView";
import type { BusinessTrip, TripExpense } from "@/types/business-trip.types";
import type { ScheduleEvent } from "@/types/index";
import type { Member } from "@/types/member.types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/accounting/trips/trip-1",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/context/auth-context", () => ({
  useAuth: () => ({ user: { uid: "admin-1" }, idToken: "mock-token" }),
}));

const mockCoach: Member = {
  id: "mira-1",
  firstName: "Мира",
  lastName: "Георгиева",
  status: "active",
  isCoach: true,
  siteId: "bkgalabovo",
} as Member;

const baseTrip: BusinessTrip = {
  id: "trip-1",
  orderNumber: 25,
  title: "Държавно първенство",
  destination: "гр. София",
  startDate: "2026-04-10T08:00:00.000Z",
  endDate: "2026-04-12T18:00:00.000Z",
  coachId: "mira-1",
  coachName: "Мира Георгиева",
  participantsIds: ["ath-1"],
  status: "approved",
  transportType: "fuel_only",
  expensesCoverage: "transport_food_sleep",
  siteId: "bkgalabovo",
  vehicle: {
    brand: "VW",
    regNumber: "CT0178PT",
    fuelNorm: 7.5,
    distanceKm: 616,
    commuteMode: "single",
  },
  financials: {
    perDiemRateEUR: 22,
    accommodationRateEUR: 25,
    isCommercialActivity: false,
  },
};

const baseEvent: ScheduleEvent = {
  id: "ev-1",
  title: "Държавно първенство",
  startDate: "2026-04-10T08:00:00.000Z",
  endDate: "2026-04-12T18:00:00.000Z",
  location: "гр. София",
  type: "competition",
  siteId: "bkgalabovo",
  attendeeMemberIds: ["ath-1"],
} as unknown as ScheduleEvent;

describe("Accounting Trip Details Views", () => {
  it("renders Haskovo -> Galabovo Energetik route and checklist in TripOverviewView for fuel_only", () => {
    render(
      <TripDetailsProvider
        initialTrip={baseTrip}
        initialEvent={baseEvent}
        initialExpenses={[]}
        initialMembersDict={{ "mira-1": mockCoach }}
      >
        <TripOverviewView />
      </TripDetailsProvider>
    );

    expect(
      screen.getByText(
        /гр\. Хасково — гр\. Гълъбово \(Спортна зала „Енергетик“\)/i
      )
    ).toBeDefined();
    expect(screen.getByText(/Чеклист за готовност/i)).toBeDefined();
    expect(screen.getByText(/Бърз треньорски режим/i)).toBeDefined();
  });

  it("shows schedule drift alert when event dates differ from trip", () => {
    const driftedEvent = {
      ...baseEvent,
      endDate: "2026-04-13T18:00:00.000Z",
    };
    render(
      <TripDetailsProvider
        initialTrip={baseTrip}
        initialEvent={driftedEvent}
        initialExpenses={[]}
        initialMembersDict={{ "mira-1": mockCoach }}
      >
        <TripOverviewView />
      </TripDetailsProvider>
    );

    expect(
      screen.getByText(/Открита е промяна в свързаното събитие от Графика/i)
    ).toBeDefined();
    expect(screen.getByText(/Синхронизирай от графика/i)).toBeDefined();
  });

  it("disables expense mutations in TripExpensesView when trip is completed (locked)", () => {
    const lockedTrip: BusinessTrip = { ...baseTrip, status: "completed" };
    const sampleExpense: TripExpense = {
      id: "exp-1",
      tripId: "trip-1",
      siteId: "bkgalabovo",
      expenseType: "accommodation",
      amountEUR: 50,
      notes: "Хотел",
    };

    render(
      <TripDetailsProvider
        initialTrip={lockedTrip}
        initialEvent={baseEvent}
        initialExpenses={[sampleExpense]}
        initialMembersDict={{ "mira-1": mockCoach }}
      >
        <TripExpensesView />
      </TripDetailsProvider>
    );

    const addBtn = screen.getByRole("button", {
      name: /Добави разход \/ фактура/i,
    }) as HTMLButtonElement;
    expect(addBtn.disabled).toBe(true);

    const editBtn = screen.getByRole("button", {
      name: /Редакция/i,
    }) as HTMLButtonElement;
    expect(editBtn.disabled).toBe(true);
  });
});
