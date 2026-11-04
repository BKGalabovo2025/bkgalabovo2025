"use client";

import React from "react";

import { AiWorkoutGeneratorModal } from "@/components/training/AiWorkoutGeneratorModal";

import { useMemberProfileContext } from "../MemberProfileContext";

export function MemberAiWorkoutNewView() {
  const { member } = useMemberProfileContext();

  return <AiWorkoutGeneratorModal member={member} standalone={true} />;
}
