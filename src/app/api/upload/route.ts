import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import pathPosix from "path/posix";

import { getSiteConfig } from "@/config/sites";
import { getAuthUser } from "@/lib/auth-utils";
import { getAdminStorage } from "@/lib/firebase-admin";

const FIRESTORE_MAX_FILE_SIZE = 800 * 1024; // 800KB max per document in Firestore (0 лв Spark tier)

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
  const base64Data = Buffer.from(arrayBuffer).toString("base64");
  const fileId = crypto.randomUUID();

  const adminDb = (await import("@/lib/firebase-admin")).getAdminDb();
  await adminDb
    .collection("sites")
    .doc(userSiteId)
    .collection("uploaded_files")
    .doc(fileId)
    .set({
      id: fileId,
      name: file.name,
      contentType: file.type || "application/octet-stream",
      size: file.size,
      path: normalizedPath,
      data: base64Data,
      createdAt: new Date().toISOString(),
    });

  return `/api/upload?fileId=${fileId}&siteId=${userSiteId}`;
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
    const buffer = Buffer.from(fileDoc?.data || "", "base64");
    const safeFileName = encodeURIComponent(fileDoc?.name || "document");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": fileDoc?.contentType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${safeFileName}"; filename*=UTF-8''${safeFileName}`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error reading file";
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

    const allowedPaths = [
      `avatars/${decodedToken.uid}/`,
      `avatars/${decodedToken.uid}`,
      `sites/${userSiteId}/`,
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

    // Free Firestore storage fallback (Spark plan - 0.00 лв)
    if (file.size > FIRESTORE_MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Файлът надвишава лимита от 800KB за директно безплатно качване. Моля, използвайте опцията 'Постави външен линк' (Google Drive, OneDrive и др.) за по-големи документи.",
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
      await adminDb
        .collection("sites")
        .doc(userSiteId)
        .collection("uploaded_files")
        .doc(fileId)
        .delete();
      return NextResponse.json({ success: true });
    }

    if (!rawPath) {
      return NextResponse.json(
        { success: false, error: "Missing path or fileId" },
        { status: 400 }
      );
    }

    const allowedPaths = [
      `avatars/${decodedToken.uid}/`,
      `avatars/${decodedToken.uid}`,
      `sites/${userSiteId}/`,
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
