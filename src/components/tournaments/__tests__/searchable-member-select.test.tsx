import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { Member } from "@/types/member.types";

import { SearchableMemberSelect } from "../searchable-member-select";

const mockMembers: Member[] = [
  {
    id: "m1",
    siteId: "bkgalabovo",
    firstName: "Иван",
    lastName: "Иванов",
    name: "Иван Иванов",
    registrationDate: new Date().toISOString(),
    ageGroup: "U15",
  },
  {
    id: "m2",
    siteId: "bkgalabovo",
    firstName: "Георги",
    lastName: "Петров",
    name: "Георги Петров",
    registrationDate: new Date().toISOString(),
    ageGroup: "U17",
  },
  {
    id: "m3",
    siteId: "bkgalabovo",
    firstName: "Мария",
    lastName: "Стоянова",
    name: "Мария Стоянова",
    registrationDate: new Date().toISOString(),
    ageGroup: "U13",
  },
];

describe("SearchableMemberSelect", () => {
  it("renders placeholder when no value is provided", () => {
    render(
      <SearchableMemberSelect
        members={mockMembers}
        onChange={vi.fn()}
        placeholder="Избери състезател..."
      />
    );

    expect(screen.getByText("Избери състезател...")).toBeInTheDocument();
  });

  it("opens dropdown and allows searching and selecting a member", () => {
    const onChange = vi.fn();
    render(
      <SearchableMemberSelect
        members={mockMembers}
        onChange={onChange}
        placeholder="Търсене..."
      />
    );

    // Click to open dropdown
    const trigger = screen.getByRole("button", { expanded: false });
    fireEvent.click(trigger);

    // Search input should be rendered
    const searchInput = screen.getByPlaceholderText(
      "Търсене на състезател по име..."
    );
    expect(searchInput).toBeInTheDocument();

    // All members initially visible
    expect(screen.getByText("Иван Иванов")).toBeInTheDocument();
    expect(screen.getByText("Георги Петров")).toBeInTheDocument();
    expect(screen.getByText("Мария Стоянова")).toBeInTheDocument();

    // Type query to filter
    fireEvent.change(searchInput, { target: { value: "Мария" } });

    expect(screen.queryByText("Иван Иванов")).not.toBeInTheDocument();
    expect(screen.queryByText("Георги Петров")).not.toBeInTheDocument();
    expect(screen.getByText("Мария Стоянова")).toBeInTheDocument();

    // Click to select
    fireEvent.click(screen.getByText("Мария Стоянова"));
    expect(onChange).toHaveBeenCalledWith("m3");
  });

  it("displays selected member and handles clear", () => {
    const onChange = vi.fn();
    render(
      <SearchableMemberSelect
        value="m2"
        members={mockMembers}
        onChange={onChange}
      />
    );

    expect(screen.getByText("Георги Петров")).toBeInTheDocument();

    const clearButton = screen.getByRole("button", {
      name: "Изчисти избора",
    });
    fireEvent.click(clearButton);

    expect(onChange).toHaveBeenCalledWith("");
  });
});
