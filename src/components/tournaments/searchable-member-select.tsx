"use client";

import { Check, ChevronsUpDown, Search, User, X } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { Member } from "@/types/member.types";

interface SearchableMemberSelectProps {
  value?: string;
  onChange: (value: string) => void;
  members: Member[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

export function SearchableMemberSelect({
  value,
  onChange,
  members,
  placeholder = "Избери състезател (търсене по име)...",
  disabled = false,
  id,
}: SearchableMemberSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedMember = useMemo(
    () => members.find((m) => m.id === value),
    [members, value]
  );

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => {
      const first = (m.firstName || "").toLowerCase();
      const last = (m.lastName || "").toLowerCase();
      const full = `${first} ${last}`.trim();
      const reversed = `${last} ${first}`.trim();
      const middle = (m.middleName || "").toLowerCase();
      const ageGroup = (m.ageGroup || "").toLowerCase();
      return (
        full.includes(q) ||
        reversed.includes(q) ||
        middle.includes(q) ||
        ageGroup.includes(q)
      );
    });
  }, [members, searchQuery]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className={cn(
          "flex h-9.5 w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs sm:text-sm shadow-xs transition-all",
          "hover:border-zinc-300 hover:bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
          "dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/50",
          disabled && "cursor-not-allowed opacity-50",
          isOpen &&
            "border-primary/50 ring-2 ring-primary/20 dark:border-primary/50"
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          {selectedMember ? (
            <>
              <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary dark:bg-primary/20">
                {selectedMember.firstName[0]}
                {selectedMember.lastName[0]}
              </div>
              <span className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                {selectedMember.firstName} {selectedMember.lastName}
              </span>
              {selectedMember.ageGroup && (
                <span className="hidden sm:inline-block rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {selectedMember.ageGroup}
                </span>
              )}
            </>
          ) : (
            <span className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500">
              <Search className="size-3.5 shrink-0" />
              <span className="truncate">{placeholder}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-zinc-400">
          {selectedMember && !disabled && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Изчисти избора"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  onChange("");
                }
              }}
              className="rounded-md p-0.5 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <X className="size-3.5" />
            </span>
          )}
          <ChevronsUpDown className="size-3.5 shrink-0 opacity-60" />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Списък със състезатели"
          className="absolute z-50 mt-1.5 flex max-h-72 w-full flex-col overflow-hidden rounded-xl border border-zinc-200/90 bg-white p-1.5 shadow-xl transition-all dark:border-zinc-800 dark:bg-zinc-950"
        >
          {/* Search Input Box */}
          <div className="relative mb-1.5 shrink-0">
            <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Търсене на състезател по име..."
              className="h-8.5 w-full rounded-lg border border-zinc-200 bg-zinc-50/80 pr-7 pl-8 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-primary/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:bg-zinc-950"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Изчисти търсенето"
                className="absolute top-1/2 right-2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* Members List */}
          <div className="custom-scrollbar flex-1 overflow-y-auto space-y-0.5 pr-0.5 max-h-52">
            {filteredMembers.length > 0 ? (
              filteredMembers.map((m) => {
                const isSelected = m.id === value;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onChange(m.id as string);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors",
                      isSelected
                        ? "bg-primary/10 font-semibold text-primary dark:bg-primary/20 dark:text-primary-foreground"
                        : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/80 dark:hover:text-white"
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <div
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                          isSelected
                            ? "bg-primary text-white"
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        )}
                      >
                        {m.firstName?.[0] || ""}
                        {m.lastName?.[0] || ""}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {m.firstName} {m.lastName}
                        </p>
                        {m.ageGroup && (
                          <p className="truncate text-[10px] text-zinc-400">
                            {m.ageGroup}
                          </p>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="ml-2 size-3.5 shrink-0 text-primary" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-zinc-400">
                <User className="mx-auto mb-1.5 size-5 opacity-40" />
                <p>Няма намерени състезатели</p>
                {searchQuery && (
                  <p className="mt-0.5 text-[10px] text-zinc-400">
                    за &quot;{searchQuery}&quot;
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
