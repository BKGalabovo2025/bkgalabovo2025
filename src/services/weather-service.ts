export interface LocationWeatherForecast {
  airTemp: number;
  minAirTemp?: number;
  maxAirTemp?: number;
  waterTemp?: number;
  rainProbability?: number; // 0 - 100%
  waveHeight?: number; // in meters (e.g. 0.4)
  seaStateBalls?: number; // 1-6 balls (Douglas scale)
  seaStateLabel?: string; // e.g. "Слабо (2 бала)"
  seaStateFlag?: string; // 🟢, 🟡, 🚩
  windSpeed?: number; // km/h
  weatherCode?: number;
  iconEmoji: string;
  conditionText: string;
  isLive?: boolean;
  lastUpdated?: string;
}

// Known coordinates for typical camp/club locations in Bulgaria
const LOCATION_COORDINATES: Record<
  string,
  { lat: number; lon: number; isCoastal?: boolean }
> = {
  приморско: { lat: 42.267, lon: 27.756, isCoastal: true },
  "ммц приморско": { lat: 42.253, lon: 27.747, isCoastal: true },
  созопол: { lat: 42.417, lon: 27.695, isCoastal: true },
  кранево: { lat: 43.344, lon: 28.061, isCoastal: true },
  албена: { lat: 43.367, lon: 28.083, isCoastal: true },
  бургас: { lat: 42.504, lon: 27.462, isCoastal: true },
  варна: { lat: 43.214, lon: 27.914, isCoastal: true },
  поморие: { lat: 42.559, lon: 27.643, isCoastal: true },
  несебър: { lat: 42.659, lon: 27.736, isCoastal: true },
  "слънчев бряг": { lat: 42.695, lon: 27.708, isCoastal: true },
  обзор: { lat: 42.818, lon: 27.881, isCoastal: true },
  синеморец: { lat: 42.062, lon: 27.978, isCoastal: true },
  лозенец: { lat: 42.213, lon: 27.809, isCoastal: true },
  царево: { lat: 42.169, lon: 27.857, isCoastal: true },
  гълъбово: { lat: 42.133, lon: 25.867, isCoastal: false },
  "стара загора": { lat: 42.425, lon: 25.634, isCoastal: false },
  софия: { lat: 42.697, lon: 23.321, isCoastal: false },
  пловдив: { lat: 42.135, lon: 24.745, isCoastal: false },
  банско: { lat: 41.838, lon: 23.488, isCoastal: false },
  пампорово: { lat: 41.658, lon: 24.695, isCoastal: false },
};

export const resolveCoordinates = (
  locationName?: string
): { lat: number; lon: number; isCoastal: boolean } => {
  if (!locationName) {
    return { lat: 42.253, lon: 27.747, isCoastal: true };
  }
  const normalized = locationName.toLowerCase();
  for (const [key, coords] of Object.entries(LOCATION_COORDINATES)) {
    if (normalized.includes(key)) {
      return { ...coords, isCoastal: coords.isCoastal ?? false };
    }
  }
  const isCoast =
    normalized.includes("плаж") ||
    normalized.includes("море") ||
    normalized.includes("ммц") ||
    normalized.includes("приморско") ||
    normalized.includes("созопол") ||
    normalized.includes("кранево") ||
    normalized.includes("варна") ||
    normalized.includes("бургас");
  return { lat: 42.253, lon: 27.747, isCoastal: isCoast };
};

export const getSeaState = (
  waveHeightMeters: number
): { balls: number; label: string; flagEmoji: string } => {
  if (waveHeightMeters < 0.15) {
    return { balls: 1, label: "Спокойно (1 бал)", flagEmoji: "🟢" };
  }
  if (waveHeightMeters < 0.5) {
    return { balls: 2, label: "Слабо (2 бала)", flagEmoji: "🟢" };
  }
  if (waveHeightMeters < 1.25) {
    return { balls: 3, label: "Умерено (3 бала)", flagEmoji: "🟡" };
  }
  if (waveHeightMeters < 2.5) {
    return { balls: 4, label: "Силно (4 бала)", flagEmoji: "🚩" };
  }
  return { balls: 5, label: "Бурно (5+ бала)", flagEmoji: "🚩" };
};

const getClearCondition = (isNight: boolean) => {
  return isNight
    ? { emoji: "🌙", text: "Ясно" }
    : { emoji: "☀️", text: "Слънчево" };
};

const getPartlyCloudyCondition = (isNight: boolean) => {
  return isNight
    ? { emoji: "☁️", text: "Лека облачност" }
    : { emoji: "🌤️", text: "Предимно слънчево" };
};

export const getWeatherCondition = (
  code: number,
  hour: number
): { emoji: string; text: string } => {
  const isNight = hour < 6 || hour >= 21;
  if (code === 0) return getClearCondition(isNight);
  if (code === 1 || code === 2) return getPartlyCloudyCondition(isNight);
  if (code === 3) return { emoji: "☁️", text: "Облачно" };
  if (code >= 45 && code <= 48) return { emoji: "🌫️", text: "Мъгла" };
  if (code >= 51 && code <= 55) return { emoji: "🌦️", text: "Ръмеж" };
  if ((code >= 61 && code <= 65) || (code >= 80 && code <= 82))
    return { emoji: "🌧️", text: "Дъжд" };
  if (code >= 71 && code <= 77) return { emoji: "❄️", text: "Сняг" };
  if (code >= 95 && code <= 99) return { emoji: "⛈️", text: "Гръмотевици" };
  return getClearCondition(isNight);
};

const getMonthlyBaseTemps = (month: number) => {
  if (month === 5)
    return {
      baseMaxAir: 26,
      baseMinAir: 17,
      baseWater: 22,
      baseWave: 0.3,
      baseRain: 15,
    };
  if (month === 6)
    return {
      baseMaxAir: 30,
      baseMinAir: 21,
      baseWater: 25,
      baseWave: 0.4,
      baseRain: 10,
    };
  if (month === 7)
    return {
      baseMaxAir: 31,
      baseMinAir: 22,
      baseWater: 27,
      baseWave: 0.4,
      baseRain: 8,
    }; // August
  if (month === 8)
    return {
      baseMaxAir: 26,
      baseMinAir: 16,
      baseWater: 23,
      baseWave: 0.5,
      baseRain: 18,
    };
  return {
    baseMaxAir: 28,
    baseMinAir: 19,
    baseWater: 24,
    baseWave: 0.4,
    baseRain: 12,
  };
};

export const getEstimatedWeather = (
  locationName: string | undefined,
  dateStr: string,
  startTimeStr: string = "12:00",
  liveForecasts?: Record<string, LocationWeatherForecast>
): LocationWeatherForecast => {
  const cleanDate = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  if (liveForecasts && liveForecasts[cleanDate]) {
    const live = liveForecasts[cleanDate];
    return { ...live, isLive: true };
  }

  const coords = resolveCoordinates(locationName);
  const [hourStr = "12"] = startTimeStr.split(":");
  const hour = parseInt(hourStr, 10) || 12;

  const d = new Date(cleanDate);
  const month = isNaN(d.getTime()) ? 7 : d.getMonth();
  const { baseMaxAir, baseMinAir, baseWater, baseWave, baseRain } =
    getMonthlyBaseTemps(month);

  const normalizedHour = (hour - 6 + 24) % 24;
  const tempCurve = Math.sin((normalizedHour / 18) * Math.PI);
  const airTemp = Math.round(
    baseMinAir + (baseMaxAir - baseMinAir) * Math.max(0, tempCurve)
  );

  let waterTemp: number | undefined;
  let waveHeight: number | undefined;
  let seaStateBalls: number | undefined;
  let seaStateLabel: string | undefined;
  let seaStateFlag: string | undefined;

  if (coords.isCoastal) {
    const afternoonBoost = hour >= 12 && hour <= 18 ? 1 : 0;
    waterTemp = Math.round(baseWater + afternoonBoost);
    waveHeight = baseWave;
    const seaInfo = getSeaState(waveHeight);
    seaStateBalls = seaInfo.balls;
    seaStateLabel = seaInfo.label;
    seaStateFlag = seaInfo.flagEmoji;
  }

  const condition = getWeatherCondition(hour >= 12 && hour <= 16 ? 0 : 1, hour);

  return {
    airTemp,
    minAirTemp: baseMinAir,
    maxAirTemp: baseMaxAir,
    waterTemp,
    rainProbability: baseRain,
    waveHeight,
    seaStateBalls,
    seaStateLabel,
    seaStateFlag,
    windSpeed: 14,
    weatherCode: 0,
    iconEmoji: condition.emoji,
    conditionText: condition.text,
    isLive: false,
  };
};

/**
 * Fetch live weather and marine forecast from Open-Meteo for a camp's location.
 */
export async function fetchLiveCampForecast(
  locationName: string | undefined
): Promise<Record<string, LocationWeatherForecast>> {
  const coords = resolveCoordinates(locationName);
  const result: Record<string, LocationWeatherForecast> = {};

  try {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=auto`;
    const marineUrl = coords.isCoastal
      ? `https://marine-api.open-meteo.com/v1/marine?latitude=${coords.lat}&longitude=${coords.lon}&daily=wave_height_max,wave_direction_dominant,wave_period_max&timezone=auto`
      : null;

    const [weatherRes, marineRes] = await Promise.all([
      fetch(weatherUrl).catch(() => null),
      marineUrl ? fetch(marineUrl).catch(() => null) : Promise.resolve(null),
    ]);

    const weatherData =
      weatherRes && weatherRes.ok ? await weatherRes.json() : null;
    const marineData =
      marineRes && marineRes.ok ? await marineRes.json() : null;

    if (weatherData?.daily?.time) {
      const dates: string[] = weatherData.daily.time;
      const maxTemps: number[] = weatherData.daily.temperature_2m_max || [];
      const minTemps: number[] = weatherData.daily.temperature_2m_min || [];
      const rainProbs: number[] =
        weatherData.daily.precipitation_probability_max || [];
      const codes: number[] = weatherData.daily.weather_code || [];
      const windSpeeds: number[] = weatherData.daily.wind_speed_10m_max || [];

      const marineDates: string[] = marineData?.daily?.time || [];
      const waveHeights: number[] = marineData?.daily?.wave_height_max || [];

      dates.forEach((dateStr, idx) => {
        const maxTemp = Math.round(maxTemps[idx] ?? 28);
        const minTemp = Math.round(minTemps[idx] ?? 18);
        const rainProb = Math.round(rainProbs[idx] ?? 0);
        const code = codes[idx] ?? 0;
        const wind = Math.round(windSpeeds[idx] ?? 12);
        const condition = getWeatherCondition(code, 14);

        // Water temp estimation based on maxTemp / seasonal baseline
        let waterTemp: number | undefined;
        let waveHeight: number | undefined;
        let seaStateBalls: number | undefined;
        let seaStateLabel: string | undefined;
        let seaStateFlag: string | undefined;

        if (coords.isCoastal) {
          const marineIdx = marineDates.indexOf(dateStr);
          if (marineIdx !== -1 && waveHeights[marineIdx] !== undefined) {
            waveHeight = Number(waveHeights[marineIdx].toFixed(1));
          } else {
            waveHeight = 0.4;
          }
          const seaInfo = getSeaState(waveHeight);
          seaStateBalls = seaInfo.balls;
          seaStateLabel = seaInfo.label;
          seaStateFlag = seaInfo.flagEmoji;
          // Approximate Black Sea temperature: August ~26-27C, July ~25-26C
          const d = new Date(dateStr);
          const month = isNaN(d.getTime()) ? 7 : d.getMonth();
          const baseWater = getMonthlyBaseTemps(month).baseWater;
          waterTemp = Math.round(
            Math.min(28, Math.max(18, baseWater + (maxTemp >= 30 ? 1 : 0)))
          );
        }

        result[dateStr] = {
          airTemp: maxTemp,
          minAirTemp: minTemp,
          maxAirTemp: maxTemp,
          waterTemp,
          rainProbability: rainProb,
          waveHeight,
          seaStateBalls,
          seaStateLabel,
          seaStateFlag,
          windSpeed: wind,
          weatherCode: code,
          iconEmoji: condition.emoji,
          conditionText: condition.text,
          isLive: true,
          lastUpdated: new Date().toLocaleTimeString("bg-BG", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
      });
    }
  } catch (err) {
    console.warn("Could not fetch live Open-Meteo weather forecast:", err);
  }

  return result;
}
