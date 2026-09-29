/**
 * Uploads a file using the server-side API to bypass CORS issues.
 * @param path - The path where the file should be stored
 * @param file - The file object to upload
 */
export const uploadFile = async (
  path: string,
  file: File,
  idToken?: string | null
): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("path", path);

  const headers: Record<string, string> = {};
  if (idToken) {
    headers["Authorization"] = `Bearer ${idToken}`;
  }

  const response = await fetch("/api/upload", {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    // 413 = Payload Too Large — Vercel връща HTML, не JSON
    if (response.status === 413) {
      throw new Error(
        "Файлът е прекалено голям за качване (максимум 4 MB). Моля намалете размера на файла и опитайте отново."
      );
    }
    let errorMessage = "Failed to upload file";
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // Ignore JSON parse failure
      }
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.downloadUrl;
};

/**
 * Deletes a file from Firebase Storage via server-side API.
 * @param path - The path of the file to delete
 * @param idToken - Optional authorization token
 */
export const deleteFile = async (
  path: string,
  idToken?: string | null
): Promise<void> => {
  const headers: Record<string, string> = {};
  if (idToken) {
    headers["Authorization"] = `Bearer ${idToken}`;
  }

  const response = await fetch(`/api/upload?path=${encodeURIComponent(path)}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete file");
  }
};
