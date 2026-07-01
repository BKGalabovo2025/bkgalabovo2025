import { NextRequest, NextResponse } from "next/server";
import { getAdminStorage } from "@/lib/firebase-admin";
import { getAuthUser } from "@/lib/auth-utils";

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
    const path = formData.get("path") as string;

    if (!file || !path) {
      return NextResponse.json(
        { success: false, error: "Missing file or path" },
        { status: 400 }
      );
    }

    const storage = getAdminStorage();
    const bucketName =
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      "bkgalabovo2025.appspot.com";
    const bucket = storage.bucket(bucketName);
    console.log(`Using bucket: ${bucket.name}`);
    const fileRef = bucket.file(path);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    // Make the file public or get a signed URL
    // For simplicity, we can make it public if the bucket allows,
    // but better is to get the standard firebase download URL format
    // or just a signed URL with long expiration.

    // In Firebase Storage, the public URL format is:
    // https://firebasestorage.googleapis.com/v0/b/[BUCKET]/o/[PATH]?alt=media
    const encodedPath = encodeURIComponent(path);
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
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json(
        { success: false, error: "Missing path" },
        { status: 400 }
      );
    }

    const storage = getAdminStorage();
    const bucketName =
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      "bkgalabovo2025.appspot.com";
    const bucket = storage.bucket(bucketName);
    console.log(`Deleting from bucket: ${bucket.name}, path: ${path}`);
    const fileRef = bucket.file(path);

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
