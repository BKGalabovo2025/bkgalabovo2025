import type { MetadataRoute } from "next";

import { getAdminDb } from "@/lib/firebase-admin";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://bkgalabovo2025.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/club`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/club/team`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/club/catalog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/club/schedule`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/club/reviews`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/recovery-zone`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/recovery-zone/catalog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/recovery-zone/team`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/recovery-zone/reviews`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  // Safely include active/public camps if Firestore Admin is available
  let campRoutes: MetadataRoute.Sitemap = [];
  try {
    const adminDb = getAdminDb();
    const campsSnapshot = await Promise.race([
      adminDb
        .collection("events")
        .where("siteId", "==", "bkgalabovo")
        .where("type", "==", "camp")
        .get(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
    ]);

    if (campsSnapshot) {
      campRoutes = campsSnapshot.docs.map((doc) => ({
        url: `${BASE_URL}/club/camps/${doc.id}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.6,
      }));
    }
  } catch (err) {
    console.warn("Sitemap: skipping dynamic camp routes:", err);
  }

  return [...staticRoutes, ...campRoutes];
}
