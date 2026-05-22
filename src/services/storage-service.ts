import { getAdminStorage } from "@/lib/firebase-admin";

// Helper for interacting with Firebase Storage (Admin SDK)
export const deleteFile = async (path: string) => {
  try {
    const storage = getAdminStorage();
    const bucket = storage.bucket();
    const file = bucket.file(path);
    await file.delete({ ignoreNotFound: true });
    return true;
  } catch (err) {
    console.error("storage-service.deleteFile error:", err);
    throw err;
  }
};

export const getPublicUrl = (path: string) => {
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || "";
  if (!bucketName) return "";
  return `https://storage.googleapis.com/${bucketName}/${encodeURI(path)}`;
};

export const uploadFileFromBuffer = async (
  path: string,
  buffer: Buffer,
  contentType = "application/octet-stream"
) => {
  const storage = getAdminStorage();
  const bucket = storage.bucket();
  const file = bucket.file(path);
  await file.save(buffer, { contentType, resumable: false });
  return getPublicUrl(path);
};

export default { deleteFile, getPublicUrl, uploadFileFromBuffer };
