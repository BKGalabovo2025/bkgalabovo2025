import { NextRequest, NextResponse } from "next/server";
import pathPosix from "path/posix";

import { getSiteConfig } from "@/config/sites";
import { getAuthUser } from "@/lib/auth-utils";
import { getAdminStorage } from "@/lib/firebase-admin";

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
    // Double decoding check to prevent nested %252e%252e attacks
    if (decodedPath.includes("%")) {
      decodedPath = decodeURIComponent(decodedPath);
    }
  } catch {
    return { valid: false, normalizedPath: "" };
  }

  // Remove null bytes and carriage returns
  const cleanPath = decodedPath.replace(/[\0\r\n]/g, "").replace(/\\/g, "/");
  // Normalize posix path
  const normalized = pathPosix.normalize(cleanPath).replace(/^\/+/, "");

  // Prevent parent directory traversal
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

    // Defense against oversized uploads (max 15MB)
    const MAX_FILE_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Размерът на файла надвишава лимита от 15MB" },
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

    const storage = getAdminStorage();
    const bucketName =
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      "bkgalabovo2025.appspot.com";
    const bucket = storage.bucket(bucketName);
    console.log(`Using bucket: ${bucket.name}`);
    const fileRef = bucket.file(normalizedPath);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    const encodedPath = encodeURIComponent(normalizedPath);
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;

    return NextResponse.json({
      success: true,
      downloadUrl,
    });
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
    const rawPath = searchParams.get("path");

    if (!rawPath) {
      return NextResponse.json(
        { success: false, error: "Missing path" },
        { status: 400 }
      );
    }

    // Validate that the path belongs to the user's site
    const adminAuth = (await import("@/lib/firebase-admin")).getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userSiteId =
      (decodedToken as { siteId?: string; allowedSites?: string[] }).siteId ||
      getSiteConfig().id;

    // Allow deletes from avatars/{userId} or sites/{siteId}/ paths
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

    const storage = getAdminStorage();
    const bucketName =
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      "bkgalabovo2025.appspot.com";
    const bucket = storage.bucket(bucketName);
    console.log(
      `Deleting from bucket: ${bucket.name}, path: ${normalizedPath}`
    );
    const fileRef = bucket.file(normalizedPath);

    await fileRef.delete();

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
