"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  fetchLiveCampForecast,
  LocationWeatherForecast,
} from "@/services/weather-service";
import type { ScheduleEvent } from "@/types";

export interface CampContextType {
  camp: ScheduleEvent;
  liveWeatherMap: Record<string, LocationWeatherForecast>;
  weatherLoading: boolean;
  loadWeather: (locationName?: string) => Promise<void>;
}

const CampContext = createContext<CampContextType | null>(null);

export function CampProvider({
  children,
  camp,
}: {
  children: React.ReactNode;
  camp: ScheduleEvent;
}) {
  const [liveWeatherMap, setLiveWeatherMap] = useState<
    Record<string, LocationWeatherForecast>
  >({});
  const [weatherLoading, setWeatherLoading] = useState(false);

  const loadWeather = useCallback(async (locationName?: string) => {
    if (!locationName) return;
    setWeatherLoading(true);
    try {
      const forecast = await fetchLiveCampForecast(locationName);
      setLiveWeatherMap(forecast);
    } catch (err) {
      console.warn("Could not load live weather:", err);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    if (camp?.location) {
      void loadWeather(camp.location);
    }
  }, [camp?.location, loadWeather]);

  const value: CampContextType = {
    camp,
    liveWeatherMap,
    weatherLoading,
    loadWeather,
  };

  return <CampContext.Provider value={value}>{children}</CampContext.Provider>;
}

export function useCampContext(): CampContextType {
  const ctx = useContext(CampContext);
  if (!ctx) {
    throw new Error("useCampContext must be used within a <CampProvider />");
  }
  return ctx;
}
