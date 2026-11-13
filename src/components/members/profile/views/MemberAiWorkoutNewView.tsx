"use client";

import Link from "next/link";
import React from "react";

import { AiWorkoutGeneratorModal } from "@/components/training/AiWorkoutGeneratorModal";

import { useMemberProfileContext } from "../MemberProfileContext";

export function MemberAiWorkoutNewView() {
  const { member, memberId } = useMemberProfileContext();

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/members/${memberId}/ai-workouts`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200/80 bg-white px-3.5 py-2 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          ← Обратно към AI Програми
        </Link>
      </div>
      <AiWorkoutGeneratorModal member={member} standalone={true} />
    </div>
  );
}
