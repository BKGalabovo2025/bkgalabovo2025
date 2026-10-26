"use client";

import { Check, Plus, RotateCcw, Users } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_BOARD_MEMBERS_TEXT,
  STANDARD_BOARD_MEMBERS,
  toggleMemberInText,
} from "@/lib/business-trip-protocol";

interface BoardMembersInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  rows?: number;
  placeholder?: string;
  className?: string;
}

export function BoardMembersInput({
  value,
  onChange,
  id,
  rows = 3,
  placeholder = "Въведете или изберете присъстващите членове на УС...",
  className,
}: BoardMembersInputProps) {
  const currentText = value || "";

  const isMemberSelected = (name: string) => {
    return currentText.toLowerCase().includes(name.toLowerCase());
  };

  const allSelected = STANDARD_BOARD_MEMBERS.every((m) =>
    isMemberSelected(m.name)
  );

  const handleToggle = (member: (typeof STANDARD_BOARD_MEMBERS)[number]) => {
    const updated = toggleMemberInText(currentText, member);
    onChange(updated);
  };

  const handleSelectAll = () => {
    onChange(DEFAULT_BOARD_MEMBERS_TEXT);
  };

  return (
    <div className="space-y-2">
      {/* Лента за бърз избор на официалните членове на УС */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
          <Users className="size-3.5 text-indigo-500" />
          Официален състав:
        </span>
        {STANDARD_BOARD_MEMBERS.map((member) => {
          const selected = isMemberSelected(member.name);
          return (
            <button
              key={member.id}
              type="button"
              onClick={() => handleToggle(member)}
              title={
                selected
                  ? `Премахни ${member.name} от присъстващите`
                  : `Добави ${member.name} към присъстващите`
              }
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors border ${
                selected
                  ? "bg-indigo-50 border-indigo-300 text-indigo-800 dark:bg-indigo-950/60 dark:border-indigo-700 dark:text-indigo-200 shadow-xs"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              {selected ? (
                <Check className="size-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
              ) : (
                <Plus className="size-3 text-slate-400 shrink-0" />
              )}
              <span>{member.name}</span>
              <span className="text-[10px] opacity-70">
                ({member.id === "mira" ? "Председател" : "Член"})
              </span>
            </button>
          );
        })}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleSelectAll}
          disabled={allSelected}
          className="h-6 px-1.5 text-[11px] font-normal text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
          title="Зареди всички 3-ма официални членове на УС"
        >
          <RotateCcw className="mr-1 size-3" />
          Всички 3-ма
        </Button>
      </div>

      {/* Текстово поле за свободен преглед и дописване на допълнителни членове */}
      <Textarea
        id={id}
        rows={rows}
        value={currentText}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`bg-white text-xs dark:bg-slate-950 font-sans leading-relaxed ${className || ""}`}
      />
    </div>
  );
}
