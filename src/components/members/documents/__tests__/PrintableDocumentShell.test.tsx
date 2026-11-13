import { fireEvent, render, renderHook, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockBack, mockPush, mockGeneratePdf } = vi.hoisted(() => ({
  mockBack: vi.fn(),
  mockPush: vi.fn(),
  mockGeneratePdf: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
}));

vi.mock("@/lib/html-to-pdf", () => ({
  generatePdfFromElement: mockGeneratePdf,
}));

import { PrintableDocumentShell } from "../PrintableDocumentShell";
import { useMemberBackNavigation } from "../useMemberBackNavigation";

describe("useMemberBackNavigation", () => {
  const originalHistoryLength = window.history.length;

  afterEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window.history, "length", {
      value: originalHistoryLength,
      configurable: true,
    });
  });

  it("вика router.back() при window.history.length > 1", () => {
    Object.defineProperty(window.history, "length", {
      value: 3,
      configurable: true,
    });

    const { result } = renderHook(() => useMemberBackNavigation("m1"));
    result.current();

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("вика router.push('/members/m1/documents') при window.history.length <= 1", () => {
    Object.defineProperty(window.history, "length", {
      value: 1,
      configurable: true,
    });

    const { result } = renderHook(() => useMemberBackNavigation("m1"));
    result.current();

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/members/m1/documents");
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("използва подадения fallbackHref при window.history.length <= 1", () => {
    Object.defineProperty(window.history, "length", {
      value: 1,
      configurable: true,
    });

    const { result } = renderHook(() =>
      useMemberBackNavigation("m1", "/members/m1/personal")
    );
    result.current();

    expect(mockPush).toHaveBeenCalledWith("/members/m1/personal");
  });
});

describe("PrintableDocumentShell", () => {
  const originalPrint = window.print;

  beforeEach(() => {
    window.print = vi.fn();
    Object.defineProperty(window.history, "length", {
      value: 1,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    window.print = originalPrint;
  });

  it("рендерира breadcrumbs, бутон Назад, бутон Принтирай и .print-area с bg-white и text-slate-900", () => {
    const { container } = render(
      <PrintableDocumentShell
        memberId="m1"
        memberName="Иван Петров"
        documentTitle="Декларация за съгласие"
      >
        <p>Съдържание на документа</p>
      </PrintableDocumentShell>
    );

    expect(screen.getByRole("link", { name: "Начало" })).toHaveAttribute(
      "href",
      "/dashboard"
    );
    expect(screen.getByRole("link", { name: "Членове" })).toHaveAttribute(
      "href",
      "/members"
    );
    expect(screen.getByRole("link", { name: "Иван Петров" })).toHaveAttribute(
      "href",
      "/members/m1"
    );
    expect(screen.getByRole("link", { name: "Документи" })).toHaveAttribute(
      "href",
      "/members/m1/documents"
    );
    expect(
      screen.getByRole("heading", { name: "Декларация за съгласие" })
    ).toBeInTheDocument();
    expect(screen.getByText("Съдържание на документа")).toBeInTheDocument();

    const backButton = screen.getByRole("button", { name: /Назад/i });
    fireEvent.click(backButton);
    expect(mockPush).toHaveBeenCalledWith("/members/m1/documents");

    const printButton = screen.getByRole("button", { name: /Принтирай/i });
    fireEvent.click(printButton);
    expect(window.print).toHaveBeenCalledTimes(1);

    const printArea = container.querySelector(".print-area");
    expect(printArea).not.toBeNull();
    expect(printArea).toHaveClass("bg-white", "text-slate-900");
  });

  it("рендерира опционален date input само при подаден onDateChange", () => {
    const { rerender } = render(
      <PrintableDocumentShell
        memberId="m1"
        memberName="Иван Петров"
        documentTitle="Заявление"
      >
        <div>Body</div>
      </PrintableDocumentShell>
    );

    expect(
      screen.queryByTitle("Редактирай датата на документа")
    ).not.toBeInTheDocument();

    const onDateChange = vi.fn();
    rerender(
      <PrintableDocumentShell
        memberId="m1"
        memberName="Иван Петров"
        documentTitle="Заявление"
        dateValue="2026-05-01"
        onDateChange={onDateChange}
      >
        <div>Body</div>
      </PrintableDocumentShell>
    );

    const dateInput = screen.getByTitle(
      "Редактирай датата на документа"
    ) as HTMLInputElement;
    expect(dateInput).toHaveValue("2026-05-01");

    fireEvent.change(dateInput, { target: { value: "2026-05-10" } });
    expect(onDateChange).toHaveBeenCalledWith("2026-05-10");
  });

  it("рендерира опционален PDF бутон при подадени pdfElementRef и pdfFileName", () => {
    const ref = React.createRef<HTMLDivElement>();

    const { rerender } = render(
      <PrintableDocumentShell
        memberId="m1"
        memberName="Иван Петров"
        documentTitle="Картотека"
      >
        <div ref={ref}>PDF content</div>
      </PrintableDocumentShell>
    );

    expect(
      screen.queryByRole("button", { name: /Изтегли PDF/i })
    ).not.toBeInTheDocument();

    rerender(
      <PrintableDocumentShell
        memberId="m1"
        memberName="Иван Петров"
        documentTitle="Картотека"
        pdfElementRef={ref}
        pdfFileName="kartoteka.pdf"
      >
        <div ref={ref}>PDF content</div>
      </PrintableDocumentShell>
    );

    const pdfButton = screen.getByRole("button", { name: /Изтегли PDF/i });
    expect(pdfButton).toBeInTheDocument();
    fireEvent.click(pdfButton);

    expect(mockGeneratePdf).toHaveBeenCalledWith(
      ref.current,
      "kartoteka.pdf",
      "portrait"
    );
  });
});
