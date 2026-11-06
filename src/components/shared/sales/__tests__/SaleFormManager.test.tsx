/// <reference types="@testing-library/jest-dom" />
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SaleFormManager } from "../SaleFormManager";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock("@/services/member-service", () => ({
  getAllMembers: vi.fn().mockResolvedValue([
    {
      id: "mem-1",
      firstName: "Иван",
      lastName: "Иванов",
      ageGroup: "U15",
    },
  ]),
}));

vi.mock("@/lib/actions/products-server", () => ({
  getProductsServerAction: vi.fn().mockResolvedValue({
    success: true,
    data: [
      {
        id: "prod-1",
        name: "Пера Yonex Aerosensa 30",
        price: 35.0,
        category: "Пера",
      },
    ],
  }),
}));

vi.mock("@/services/club-service", () => ({
  getAllClubServices: vi.fn().mockResolvedValue([]),
}));

describe("SaleFormManager Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCart = [
    {
      productId: "prod-test-1",
      name: "Накитник Yonex",
      quantity: 2,
      price: 10.0,
    },
  ];

  it("renders the sales form with initial items and breadcrumbs", async () => {
    await act(async () => {
      render(
        <SaleFormManager
          title="Редактиране на продажба"
          description="Редакция на детайлите за продажба"
          breadcrumbs={[
            { label: "Начало", href: "/dashboard" },
            { label: "Продажби", href: "/sales" },
            { label: "Редакция" },
          ]}
          cancelUrl="/sales"
          initialCart={mockCart}
          initialMemberId="mem-1"
          initialStatus="completed"
          submitText="Запази промените"
          onSubmit={vi.fn()}
          isSubmitting={false}
        />
      );
    });

    expect(screen.getByText("Редактиране на продажба")).toBeInTheDocument();
    expect(screen.getByText("Накитник Yonex")).toBeInTheDocument();
    expect(screen.getByText("Запази промените")).toBeInTheDocument();
  });

  it("calls onSubmit when clicking submit button", async () => {
    const mockSubmit = vi.fn().mockResolvedValue(undefined);

    await act(async () => {
      render(
        <SaleFormManager
          title="Редактиране на продажба"
          description="Редакция на детайлите"
          breadcrumbs={[{ label: "Начало", href: "/dashboard" }]}
          cancelUrl="/sales"
          initialCart={mockCart}
          initialMemberId="mem-1"
          initialStatus="completed"
          submitText="Запази промените"
          onSubmit={mockSubmit}
          isSubmitting={false}
        />
      );
    });

    const submitBtn = screen.getByRole("button", {
      name: "Запази промените",
    });

    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(mockSubmit).toHaveBeenCalledTimes(1);
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        memberId: "mem-1",
        status: "completed",
        totalAmount: 20,
      })
    );
  });
});
