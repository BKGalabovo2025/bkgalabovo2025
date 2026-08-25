export interface LocationWeatherForecast {
  airTemp: number;
  waterTemp?: number;
  weatherCode?: number;
  iconEmoji: string;
  conditionText: string;
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
    normalized.includes("приморско");
  return { lat: 42.253, lon: 27.747, isCoastal: isCoast };
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
  if (code >= 95 && code <= 99) return { emoji: "⛈️", text: "Гръмотевици" };
  return getClearCondition(isNight);
};

const getMonthlyBaseTemps = (month: number) => {
  if (month === 5) return { baseMaxAir: 26, baseMinAir: 17, baseWater: 22 };
  if (month === 6) return { baseMaxAir: 30, baseMinAir: 21, baseWater: 25 };
  if (month === 8) return { baseMaxAir: 25, baseMinAir: 16, baseWater: 23 };
  return { baseMaxAir: 30, baseMinAir: 21, baseWater: 26 }; // August (month 7) or default summer
};

export const getEstimatedWeather = (
  locationName: string | undefined,
  dateStr: string,
  startTimeStr: string
): LocationWeatherForecast => {
  const coords = resolveCoordinates(locationName);
  const [hourStr = "10"] = startTimeStr.split(":");
  const hour = parseInt(hourStr, 10) || 10;

  const d = new Date(dateStr);
  const month = isNaN(d.getTime()) ? 7 : d.getMonth();
  const { baseMaxAir, baseMinAir, baseWater } = getMonthlyBaseTemps(month);

  const normalizedHour = (hour - 6 + 24) % 24;
  const tempCurve = Math.sin((normalizedHour / 18) * Math.PI);
  const airTemp = Math.round(
    baseMinAir + (baseMaxAir - baseMinAir) * Math.max(0, tempCurve)
  );

  let waterTemp: number | undefined;
  if (coords.isCoastal) {
    const afternoonBoost = hour >= 12 && hour <= 18 ? 1 : 0;
    waterTemp = Math.round(baseWater + afternoonBoost);
  }

  const condition = getWeatherCondition(hour >= 12 && hour <= 16 ? 0 : 1, hour);

  return {
    airTemp,
    waterTemp,
    weatherCode: 0,
    iconEmoji: condition.emoji,
    conditionText: condition.text,
  };
};
