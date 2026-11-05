import { describe, expect, it } from "vitest";

describe("UnifiedSaleWizard quantity and total calculation logic", () => {
  const calculateTotal = ({
    mode,
    price,
    quantity,
    isGuestSale = false,
    paymentMode = "individual",
    selectedMonthKeys = [] as string[],
    selectedEventIds = [] as string[],
  }: {
    mode: "product" | "training" | "recovery" | "general";
    price: string;
    quantity: string;
    isGuestSale?: boolean;
    paymentMode?: "subscription" | "individual";
    selectedMonthKeys?: string[];
    selectedEventIds?: string[];
  }) => {
    const q = parseInt(quantity, 10);
    const parsedQuantity = !isNaN(q) && q > 0 ? q : 1;
    const unitPrice = parseFloat(price) || 0;

    if (mode === "product" || mode === "general") {
      return {
        unitPrice,
        parsedQuantity,
        totalAmount: unitPrice * parsedQuantity,
      };
    }
    if (isGuestSale) {
      return {
        unitPrice,
        parsedQuantity: 1,
        totalAmount: unitPrice,
      };
    }
    if (paymentMode === "subscription") {
      const months = selectedMonthKeys.length || 1;
      return {
        unitPrice,
        parsedQuantity: months,
        totalAmount: unitPrice * months,
      };
    }
    if (paymentMode === "individual") {
      const eventsCount = selectedEventIds.length || 1;
      return {
        unitPrice,
        parsedQuantity: eventsCount,
        totalAmount: unitPrice * eventsCount,
      };
    }
    return {
      unitPrice,
      parsedQuantity: 1,
      totalAmount: unitPrice,
    };
  };

  it("изчислява правилно Обща сума за 2 броя грип по 2 EUR (общо 4 EUR)", () => {
    const res = calculateTotal({
      mode: "product",
      price: "2",
      quantity: "2",
      isGuestSale: false,
    });

    expect(res.parsedQuantity).toBe(2);
    expect(res.totalAmount).toBe(4);
  });

  it("изчислява правилно Обща сума за външен клиент (гост) закупуващ 3 броя продукт по 2.50 EUR", () => {
    const res = calculateTotal({
      mode: "product",
      price: "2.50",
      quantity: "3",
      isGuestSale: true,
    });

    expect(res.parsedQuantity).toBe(3);
    expect(res.totalAmount).toBe(7.5);
  });

  it("изчислява правилно обща сума за обща услуга (напр. наплитане 2 бр. по 15 EUR)", () => {
    const res = calculateTotal({
      mode: "general",
      price: "15",
      quantity: "2",
      isGuestSale: false,
    });

    expect(res.parsedQuantity).toBe(2);
    expect(res.totalAmount).toBe(30);
  });

  it("обработва безопасно празно или невалидно количество (дефолт към 1)", () => {
    const res = calculateTotal({
      mode: "product",
      price: "2",
      quantity: "",
    });

    expect(res.parsedQuantity).toBe(1);
    expect(res.totalAmount).toBe(2);
  });

  it("запазва логиката за месечен абонамент (2 месеца по 20 EUR = 40 EUR)", () => {
    const res = calculateTotal({
      mode: "training",
      price: "20",
      quantity: "1",
      paymentMode: "subscription",
      selectedMonthKeys: ["2026-10", "2026-11"],
    });

    expect(res.parsedQuantity).toBe(2);
    expect(res.totalAmount).toBe(40);
  });
});
