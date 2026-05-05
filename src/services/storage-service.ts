import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { getApp } from "firebase/app";

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 * @param path - The path where the file should be stored (e.g., 'avatars/member-id.png')
 * @param file - The file object to upload
 */
export const uploadFile = async (path: string, file: File): Promise<string> => {
  const storage = getStorage(getApp());
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);

  return downloadURL;
};

/**
 * Deletes a file from Firebase Storage.
 * @param path - The path of the file to delete
 */
export const deleteFile = async (path: string): Promise<void> => {
  const storage = getStorage(getApp());
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
};
