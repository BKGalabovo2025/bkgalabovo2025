import { NextResponse } from "next/server";
import { z } from "zod";

import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const CACHE_SECONDS = 1800;

const WeatherQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  coastal: z.enum(["0", "1"]).optional(),
});

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
  const ip = getClientIp(request);
  const rate = await checkRateLimit(`weather:${ip}`, 30, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = WeatherQuerySchema.safeParse({
    lat: searchParams.get("lat"),
    lon: searchParams.get("lon"),
    coastal: searchParams.get("coastal") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Невалидни координати." },
      { status: 400 }
    );
  }
  const { lat, lon } = parsed.data;
  const coastal = parsed.data.coastal === "1";

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
