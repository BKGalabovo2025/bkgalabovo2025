/**
 * Uploads a file using the server-side API to bypass CORS issues.
 * @param path - The path where the file should be stored
 * @param file - The file object to upload
 */
export const uploadFile = async (path: string, file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("path", path);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to upload file");
  }

  const data = await response.json();
  return data.downloadUrl;
};

/**
 * Deletes a file from Firebase Storage via server-side API.
 * @param path - The path of the file to delete
 */
export const deleteFile = async (path: string): Promise<void> => {
  const response = await fetch(`/api/upload?path=${encodeURIComponent(path)}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete file");
  }
};
