"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/context/auth-context";
import {
  deleteChairpersonSignatureAction,
  getChairpersonSignatureAction,
  saveChairpersonSignatureAction,
} from "@/lib/actions/chairperson-signature";

const LOCAL_STORAGE_KEY = "bkgalabovo_chairperson_signature_v1";

export function useChairpersonSignature() {
  const { idToken, getFreshToken } = useAuth();
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [isApplied, setIsApplied] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load signature on mount
  useEffect(() => {
    let active = true;

    // Fast initial preview from localStorage
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        setSignatureUrl(cached);
        setIsLoading(false);
      }
    }

    // Authoritative fetch from Firestore
    getChairpersonSignatureAction()
      .then((res) => {
        if (!active) return;
        if (res.success && res.data?.signatureUrl) {
          setSignatureUrl(res.data.signatureUrl);
          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_STORAGE_KEY, res.data.signatureUrl);
          }
        }
      })
      .catch((err) =>
        console.error("Error loading chairperson signature:", err)
      )
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSaveSignature = async (signatureFile: File) => {
    try {
      const token = idToken || (await getFreshToken());
      if (!token) {
        toast.error("Не сте оторизиран като администратор.");
        return;
      }

      // Convert File to Base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(signatureFile);
      });

      const res = await saveChairpersonSignatureAction({
        signatureBase64: base64,
        idToken: token,
      });

      if (res.success) {
        setSignatureUrl(base64);
        setIsApplied(true);
        if (typeof window !== "undefined") {
          localStorage.setItem(LOCAL_STORAGE_KEY, base64);
        }
        toast.success("Електронният подпис на Председателя е запазен!");
        setDialogOpen(false);
      } else {
        toast.error(res.error || "Грешка при запис на подписа.");
      }
    } catch (err) {
      console.error("Save signature error:", err);
      toast.error("Възникна грешка при запазване на подписа.");
    }
  };

  const handleRemoveSignature = async () => {
    if (
      !window.confirm(
        "Сигурни ли сте, че искате да премахнете запазения подпис на Председателя?"
      )
    ) {
      return;
    }

    try {
      const token = idToken || (await getFreshToken());
      if (token) {
        await deleteChairpersonSignatureAction({ idToken: token });
      }
      setSignatureUrl(null);
      setIsApplied(false);
      if (typeof window !== "undefined") {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
      toast.success("Подписът на Председателя е премахнат.");
    } catch (err) {
      console.error("Remove signature error:", err);
      toast.error("Грешка при премахване на подписа.");
    }
  };

  const toggleApplied = () => setIsApplied((prev) => !prev);

  return {
    signatureUrl,
    isApplied: isApplied && !!signatureUrl,
    isLoading,
    dialogOpen,
    setDialogOpen,
    toggleApplied,
    handleSaveSignature,
    handleRemoveSignature,
  };
}
