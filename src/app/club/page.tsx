import type { Metadata } from "next";
import fs from "fs";
import path from "path";
import { getAdminDb } from "@/lib/firebase-admin";
import ClubClient from "./ClubClient";

export const metadata: Metadata = {
  title: "БК Гълъбово | Бадминтон клуб Гълъбово",
  description:
    "Официален сайт на Бадминтон клуб Гълъбово — турнири, ранглиста, тренировки и членство. Град Гълъбово.",
};

export default async function ClubMainPage() {
  const adminDb = getAdminDb();

  // Fetch 7 day schedule (events with siteId bkgalabovo)
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOf7Days = new Date(now);
  endOf7Days.setDate(now.getDate() + 7);
  endOf7Days.setHours(23, 59, 59, 999);

  // We fetch all events and filter locally to avoid Timestamp vs ISO String comparison issues in Firestore
  let scheduleSnapshot;
  try {
    scheduleSnapshot = await adminDb
      .collection("events")
      .where("siteId", "==", "bkgalabovo")
      .get();
  } catch (error) {
    console.error("Failed to fetch events for club page:", error);
    scheduleSnapshot = { docs: [] };
  }

  const scheduleRaw = scheduleSnapshot.docs.map((doc: any) => {
    const data = doc.data();

    // Handle both Timestamp and string representations of date
    let startDateStr = new Date().toISOString();
    if (data.startDate) {
      startDateStr =
        typeof data.startDate === "string"
          ? data.startDate
          : data.startDate.toDate?.().toISOString() || data.startDate;
    }

    let endDateStr = new Date().toISOString();
    if (data.endDate) {
      endDateStr =
        typeof data.endDate === "string"
          ? data.endDate
          : data.endDate.toDate?.().toISOString() || data.endDate;
    }

    return {
      id: doc.id,
      title: data.title || "Тренировка",
      startTime: startDateStr,
      endTime: endDateStr,
      isCancelled: !!data.isCancelled,
    };
  });

  // Filter for next 7 days and sort
  const schedule = scheduleRaw
    .filter((event) => {
      const eventStart = new Date(event.startTime);
      return eventStart >= startOfDay && eventStart < endOf7Days;
    })
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

  // Fetch hall images dynamically
  let hallImages: string[] = [];
  try {
    const hallDir = path.join(process.cwd(), "public", "hall");
    const files = fs.readdirSync(hallDir);
    hallImages = files
      .filter((file) => /\.(png|jpe?g|webp|gif|svg)$/i.test(file))
      .map((file) => `/hall/${file}`);
  } catch (error) {
    console.error("Error reading hall images directory:", error);
    // Fallback if directory fails to read
    hallImages = ["/hall/zala1.webp"];
  }

  return <ClubClient schedule={schedule} hallImages={hallImages} />;
}
