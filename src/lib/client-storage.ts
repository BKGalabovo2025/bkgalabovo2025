export async function uploadFile(path: string, file: File, idToken?: string | null): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("path", path);

  const headers: Record<string, string> = {};
  if (idToken) headers["Authorization"] = `Bearer ${idToken}`;

  const response = await fetch("/api/upload", {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to upload file");
  }

  const data = await response.json();
  return data.downloadUrl;
}

export async function deleteFileClient(path: string, idToken?: string | null): Promise<void> {
  const headers: Record<string, string> = {};
  if (idToken) headers["Authorization"] = `Bearer ${idToken}`;

  const response = await fetch(`/api/upload?path=${encodeURIComponent(path)}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete file");
  }
}

export default { uploadFile, deleteFileClient };
