"use client";

import React from "react";

import { CampItineraryClient } from "@/app/(protected)/training/camps/[id]/CampItineraryClient";
import { useCampContext } from "@/components/camps/CampContext";

export function ItinerarySectionView() {
  const { camp, liveWeatherMap } = useCampContext();

  return (
    <div className="focus-visible:outline-none">
      <CampItineraryClient camp={camp} liveWeatherMap={liveWeatherMap} />
    </div>
  );
}
