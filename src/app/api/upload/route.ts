/* eslint-disable sonarjs/cognitive-complexity */
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import pathPosix from "path/posix";

import { getSiteConfig } from "@/config/sites";
import { getAuthUser } from "@/lib/auth-utils";
import { getAdminStorage } from "@/lib/firebase-admin";

const FIRESTORE_MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB max per file using Firestore chunking
const FIRESTORE_CHUNK_SIZE = 600 * 1024; // 600KB binary per chunk (~800KB base64, safe under 1MB Firestore doc limit)

function sanitizeAndValidateStoragePath(
  rawPath: string,
  allowedPrefixes: string[]
): { valid: boolean; normalizedPath: string } {
  if (!rawPath || typeof rawPath !== "string") {
    return { valid: false, normalizedPath: "" };
  }

  let decodedPath = rawPath;
  try {
    decodedPath = decodeURIComponent(rawPath);
    if (decodedPath.includes("%")) {
      decodedPath = decodeURIComponent(decodedPath);
    }
  } catch {
    return { valid: false, normalizedPath: "" };
  }

  const cleanPath = decodedPath.replace(/[\0\r\n]/g, "").replace(/\\/g, "/");
  const normalized = pathPosix.normalize(cleanPath).replace(/^\/+/, "");

  if (
    normalized.startsWith("..") ||
    normalized.includes("/../") ||
    normalized.endsWith("/..") ||
    normalized === ".."
  ) {
    return { valid: false, normalizedPath: "" };
  }

  const isAllowed = allowedPrefixes.some((prefix) => {
    const cleanPrefix = prefix.replace(/^\/+/, "");
    return normalized === cleanPrefix || normalized.startsWith(cleanPrefix);
  });

  return { valid: isAllowed, normalizedPath: normalized };
}

async function saveFileToFirestore(
  file: File,
  normalizedPath: string,
  userSiteId: string
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);
  const fileId = crypto.randomUUID();

  const adminDb = (await import("@/lib/firebase-admin")).getAdminDb();
  const fileDocRef = adminDb
    .collection("sites")
    .doc(userSiteId)
    .collection("uploaded_files")
    .doc(fileId);

  if (fileBuffer.length <= FIRESTORE_CHUNK_SIZE) {
    await fileDocRef.set({
      id: fileId,
      name: file.name,
      contentType: file.type || "application/octet-stream",
      size: file.size,
      path: normalizedPath,
      data: fileBuffer.toString("base64"),
      createdAt: new Date().toISOString(),
    });
  } else {
    const totalChunks = Math.ceil(fileBuffer.length / FIRESTORE_CHUNK_SIZE);
    const batch = adminDb.batch();

    batch.set(fileDocRef, {
      id: fileId,
      name: file.name,
      contentType: file.type || "application/octet-stream",
      size: file.size,
      path: normalizedPath,
      chunksCount: totalChunks,
      createdAt: new Date().toISOString(),
    });

    for (let i = 0; i < totalChunks; i++) {
      const chunkStart = i * FIRESTORE_CHUNK_SIZE;
      const chunkEnd = Math.min(
        chunkStart + FIRESTORE_CHUNK_SIZE,
        fileBuffer.length
      );
      const chunkSlice = fileBuffer.subarray(chunkStart, chunkEnd);
      const chunkRef = fileDocRef
        .collection("chunks")
        .doc(String(i).padStart(4, "0"));

      batch.set(chunkRef, {
        index: i,
        data: chunkSlice.toString("base64"),
      });
    }

    await batch.commit();
  }

  const safeName = encodeURIComponent(file.name || "file");
  return `/api/upload?fileId=${fileId}&siteId=${userSiteId}&fileName=${safeName}`;
}

async function checkCloudStorageBucket() {
  try {
    const storage = getAdminStorage();
    const primaryBucketName =
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      "bkgalabovo2025.appspot.com";
    const bucket = storage.bucket(primaryBucketName);
    const [exists] = await bucket.exists();
    if (exists) return bucket;

    const fallbackBucket = storage.bucket("bkgalabovo2025.firebasestorage.app");
    const [fallbackExists] = await fallbackBucket.exists();
    if (fallbackExists) return fallbackBucket;

    return null;
  } catch {
    return null;
  }
}

async function saveFileToCloudStorage(
  file: File,
  normalizedPath: string,
  bucket: ReturnType<typeof getAdminStorage>["bucket"] extends (
    ...args: string[]
  ) => infer R
    ? R
    : never
): Promise<string> {
  const fileRef = bucket.file(normalizedPath);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const downloadToken = crypto.randomUUID();
  await fileRef.save(buffer, {
    metadata: {
      contentType: file.type,
      metadata: {
        firebaseStorageDownloadTokens: downloadToken,
      },
    },
  });

  const encodedPath = encodeURIComponent(normalizedPath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${downloadToken}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");
    const siteId = searchParams.get("siteId") || getSiteConfig().id;

    if (!fileId) {
      return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
    }

    // 1. Authenticate via Bearer token or session cookie
    let user = null;
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const { getAuthUser } = await import("@/lib/auth-utils");
        user = await getAuthUser(authHeader.substring(7));
      } catch {
        // Invalid bearer token, will try session cookie
      }
    }

    if (!user) {
      const { getAuthUserFromSessionCookie } = await import("@/lib/auth-utils");
      user = await getAuthUserFromSessionCookie();
    }

    const adminDb = (await import("@/lib/firebase-admin")).getAdminDb();
    const docSnap = await adminDb
      .collection("sites")
      .doc(siteId)
      .collection("uploaded_files")
      .doc(fileId)
      .get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const fileDoc = docSnap.data();
    const isPublicMedia =
      fileDoc?.contentType?.startsWith("image/") ||
      fileDoc?.path?.includes("avatars") ||
      fileDoc?.path?.includes("sponsors") ||
      fileDoc?.path?.includes("media") ||
      fileDoc?.path?.includes("certificates") ||
      fileDoc?.path?.includes("vouchers") ||
      fileDoc?.path?.includes("events");

    if (!user && !isPublicMedia) {
      return NextResponse.json(
        {
          error:
            "Unauthorized: Влизането в профил е задължително за достъп до прикачени документи.",
        },
        { status: 401 }
      );
    }

    // 2. Tenant isolation check (for protected private files)
    if (user && !isPublicMedia) {
      const allowedSites = (user as { allowedSites?: string[] }).allowedSites;
      const isSuperAdmin =
        user.email === "bkgalabovo2014@gmail.com" ||
        user.email === "recoveryzonebyzm@gmail.com";
      if (
        !isSuperAdmin &&
        allowedSites &&
        allowedSites.length > 0 &&
        !allowedSites.includes(siteId)
      ) {
        return NextResponse.json(
          { error: "Forbidden: Нямате достъп до файловете на този клон." },
          { status: 403 }
        );
      }
    }

    let buffer: Buffer;
    if (fileDoc?.chunksCount && Number(fileDoc.chunksCount) > 0) {
      const chunksSnap = await adminDb
        .collection("sites")
        .doc(siteId)
        .collection("uploaded_files")
        .doc(fileId)
        .collection("chunks")
        .orderBy("index", "asc")
        .get();

      const chunkBuffers = chunksSnap.docs.map((d) =>
        Buffer.from(d.data().data || "", "base64")
      );
      buffer = Buffer.concat(chunkBuffers);
    } else {
      buffer = Buffer.from(fileDoc?.data || "", "base64");
    }
    const safeFileName = encodeURIComponent(fileDoc?.name || "document");

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": fileDoc?.contentType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${safeFileName}"; filename*=UTF-8''${safeFileName}`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error reading file";
    if (message.includes("RESOURCE_EXHAUSTED")) {
      const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#f8fafc" rx="12"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#94a3b8" font-weight="bold">Лого</text></svg>`;
      return new NextResponse(placeholderSvg, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=30",
        },
      });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    const token = authHeader.substring(7);
    try {
      await getAuthUser(token);
    } catch (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const rawPath = formData.get("path") as string;

    if (!file || !rawPath) {
      return NextResponse.json(
        { success: false, error: "Missing file or path" },
        { status: 400 }
      );
    }

    // Validate that the path belongs strictly to the user's allowed scope
    const adminAuth = (await import("@/lib/firebase-admin")).getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userSiteId =
      (decodedToken as { siteId?: string; allowedSites?: string[] }).siteId ||
      getSiteConfig().id;

    const userSites = Array.from(
      new Set(
        [
          userSiteId,
          ...((decodedToken as { allowedSites?: string[] }).allowedSites || []),
          getSiteConfig().id,
          "bkgalabovo",
          "recoveryzone",
        ].filter(Boolean) as string[]
      )
    );

    const allowedPaths = [
      `avatars/${decodedToken.uid}/`,
      `avatars/${decodedToken.uid}`,
      ...userSites.map((s) => `sites/${s}/`),
      `certificates/`,
    ];

    const { valid, normalizedPath } = sanitizeAndValidateStoragePath(
      rawPath,
      allowedPaths
    );

    if (!valid) {
      return NextResponse.json(
        { success: false, error: "Invalid path for your site" },
        { status: 403 }
      );
    }

    // Check if Cloud Storage is available
    const bucket = await checkCloudStorageBucket();

    if (bucket) {
      // Use Cloud Storage if available
      const downloadUrl = await saveFileToCloudStorage(
        file,
        normalizedPath,
        bucket
      );
      return NextResponse.json({ success: true, downloadUrl });
    }

    // Free Firestore storage fallback (Spark plan - 0.00 лв, with automatic chunking up to 15MB)
    if (file.size > FIRESTORE_MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Файлът надвишава максималния размер от 15MB за директно качване. Моля, използвайте по-малък файл или външен линк.",
        },
        { status: 400 }
      );
    }

    const downloadUrl = await saveFileToFirestore(
      file,
      normalizedPath,
      userSiteId
    );
    return NextResponse.json({ success: true, downloadUrl });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Server-side upload error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    const token = authHeader.substring(7);
    try {
      await getAuthUser(token);
    } catch (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");
    const rawPath = searchParams.get("path");

    // Validate that the path belongs to the user's site
    const adminAuth = (await import("@/lib/firebase-admin")).getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userSiteId =
      (decodedToken as { siteId?: string; allowedSites?: string[] }).siteId ||
      getSiteConfig().id;

    if (fileId) {
      const adminDb = (await import("@/lib/firebase-admin")).getAdminDb();
      const targetDocRef = adminDb
        .collection("sites")
        .doc(userSiteId)
        .collection("uploaded_files")
        .doc(fileId);

      const docSnap = await targetDocRef.get();
      if (docSnap.exists) {
        const data = docSnap.data();
        if (data?.chunksCount) {
          const chunksSnap = await targetDocRef.collection("chunks").get();
          const batch = adminDb.batch();
          chunksSnap.docs.forEach((doc) => batch.delete(doc.ref));
          batch.delete(targetDocRef);
          await batch.commit();
          return NextResponse.json({ success: true });
        }
      }

      await targetDocRef.delete();
      return NextResponse.json({ success: true });
    }

    if (!rawPath) {
      return NextResponse.json(
        { success: false, error: "Missing path or fileId" },
        { status: 400 }
      );
    }

    const userSites = Array.from(
      new Set(
        [
          (decodedToken as { siteId?: string }).siteId,
          ...((decodedToken as { allowedSites?: string[] }).allowedSites || []),
          getSiteConfig().id,
          "bkgalabovo",
          "recoveryzone",
        ].filter(Boolean) as string[]
      )
    );

    const allowedPaths = [
      `avatars/${decodedToken.uid}/`,
      `avatars/${decodedToken.uid}`,
      ...userSites.map((s) => `sites/${s}/`),
      `certificates/`,
    ];

    const { valid, normalizedPath } = sanitizeAndValidateStoragePath(
      rawPath,
      allowedPaths
    );

    if (!valid) {
      return NextResponse.json(
        { success: false, error: "Invalid path for your site" },
        { status: 403 }
      );
    }

    const bucket = await checkCloudStorageBucket();
    if (bucket) {
      const fileRef = bucket.file(normalizedPath);
      await fileRef.delete();
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Server-side delete error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
