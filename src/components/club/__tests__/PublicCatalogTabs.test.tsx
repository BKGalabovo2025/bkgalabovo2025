import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import PublicCatalogTabs from "../PublicCatalogTabs";

describe("PublicCatalogTabs", () => {
  it("matches DOM snapshot", () => {
    // This is the FAST alternative to visual tests!
    // It renders the HTML structure and checks if any classes or elements changed.
    // It takes milliseconds instead of minutes.
    const { container } = render(
      <PublicCatalogTabs trainings={[]} generalServices={[]} products={[]} />
    );
    expect(container).toMatchSnapshot();
  });

  it('renders only the recovery tab with emerald accent styling when allowedTabs={["recovery"]}', () => {
    render(
      <PublicCatalogTabs
        allowedTabs={["recovery"]}
        recoveryServices={[
          {
            id: "rec-1",
            name: "Криосауна",
            price: 30,
            category: "Възстановяване",
            numberOfDays: 1,
          },
        ]}
      />
    );

    const recoveryTab = screen.getByRole("button", {
      name: /Възстановяване \(Recovery\)/i,
    });
    expect(recoveryTab).toBeInTheDocument();
    expect(recoveryTab).toHaveAttribute("aria-current", "page");
    expect(recoveryTab).toHaveClass(
      "bg-emerald-700",
      "text-white",
      "shadow-emerald-700/30"
    );

    expect(
      screen.queryByRole("button", { name: /Тренировки & Абонаменти/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Клубни услуги & Наеми/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Клубен магазин & Стоки/i })
    ).not.toBeInTheDocument();

    const ctaButton = screen.getByRole("button", { name: /Заяви час/i });
    expect(ctaButton).toHaveClass("bg-emerald-700");
  });

  it("formats price suffixes for subscription billing periods and service units", () => {
    render(
      <PublicCatalogTabs
        allowedTabs={["trainings"]}
        trainings={[
          {
            id: "t-month",
            name: "Месечна карта",
            type: "Абонамент",
            billingPeriod: "Месечен",
            price: 60,
          },
          {
            id: "t-year",
            name: "Годишна карта",
            type: "Годишен абонамент",
            billingPeriod: "Годишен",
            price: 600,
          },
          {
            id: "t-week",
            name: "Седмична карта",
            type: "Абонамент",
            billingPeriod: "Седмичен",
            price: 20,
          },
          {
            id: "t-single",
            name: "Единична тренировка",
            type: "Еднократно плащане",
            price: 15,
          },
        ]}
      />
    );

    expect(screen.getByText("/ месец")).toBeInTheDocument();
    expect(screen.getByText("/ година")).toBeInTheDocument();
    expect(screen.getByText("/ седмица")).toBeInTheDocument();
    expect(screen.getByText("/ посещение")).toBeInTheDocument();
  });

  it('displays "Цена при запитване" when price <= 0', () => {
    render(
      <PublicCatalogTabs
        allowedTabs={["trainings"]}
        trainings={[
          {
            id: "t-zero",
            name: "Индивидуална подготовка",
            type: "Абонамент",
            billingPeriod: "Месечен",
            price: 0,
          },
          {
            id: "t-neg",
            name: "Специален пакет",
            type: "Абонамент",
            billingPeriod: "Годишен",
            price: -5,
          },
        ]}
      />
    );

    const inquiryLabels = screen.getAllByText("Цена при запитване");
    expect(inquiryLabels).toHaveLength(2);
    expect(screen.queryByText("/ месец")).not.toBeInTheDocument();
    expect(screen.queryByText("/ година")).not.toBeInTheDocument();
  });
});
