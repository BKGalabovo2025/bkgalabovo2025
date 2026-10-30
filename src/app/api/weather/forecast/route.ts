import { NextResponse } from "next/server";

const CACHE_SECONDS = 1800;

const parseCoord = (value: string | null, min: number, max: number) => {
  const num = Number(value);
  return Number.isFinite(num) && num >= min && num <= max ? num : null;
};

async function fetchJsonSafe(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, { next: { revalidate: CACHE_SECONDS } });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

/**
 * Public same-origin proxy for Open-Meteo forecasts.
 * Keeps third-party requests off the browser, so a rate-limited or failing
 * upstream never produces console/network errors on public pages. It always
 * answers 200 and returns null for data that could not be loaded.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseCoord(searchParams.get("lat"), -90, 90);
  const lon = parseCoord(searchParams.get("lon"), -180, 180);
  const coastal = searchParams.get("coastal") === "1";

  if (lat === null || lon === null) {
    return NextResponse.json(
      { error: "Невалидни координати." },
      { status: 400 }
    );
  }

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=auto`;
  const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&daily=wave_height_max,wave_direction_dominant,wave_period_max&timezone=auto`;

  const [weather, marine] = await Promise.all([
    fetchJsonSafe(weatherUrl),
    coastal ? fetchJsonSafe(marineUrl) : Promise.resolve(null),
  ]);

  return NextResponse.json(
    { weather, marine },
    {
      headers: {
        "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=3600`,
      },
    }
  );
}
