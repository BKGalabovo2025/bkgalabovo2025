/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable sonarjs/no-nested-conditional */
"use client";

import {
  CheckCircle2,
  Loader2,
  MessageSquare,
  Phone,
  Send,
  User,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface CatalogInquiryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id?: string;
    name: string;
    price?: number;
    description?: string;
    category?: string;
  } | null;
  tab: "trainings" | "general" | "products" | "recovery";
  lang?: string;
}

export function CatalogInquiryDialog({
  isOpen,
  onClose,
  item,
  tab,
  lang = "bg",
}: CatalogInquiryDialogProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [target, setTarget] = useState<"self" | "child">("self");
  const [childAge, setChildAge] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!item) return null;

  const showPrice = typeof item.price === "number" && item.price > 0;
  const isTraining = tab === "trainings";
  const isProduct = tab === "products";

  const defaultNotePlaceholder = isProduct
    ? lang === "en"
      ? "Please share availability, delivery options, or any questions..."
      : "Моля, посочете ако имате въпрос за размер, наличност, цена или доставка..."
    : lang === "en"
      ? "Preferred date or additional questions..."
      : "Желани дни, часове или допълнителни въпроси...";

  const resetForm = () => {
    setName("");
    setPhone("");
    setTarget("self");
    setChildAge("");
    setNotes("");
    setIsSuccess(false);
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage(
        lang === "en"
          ? "Please enter your name."
          : "Моля, въведете Вашето име и фамилия."
      );
      return;
    }

    if (!phone.trim() || phone.trim().length < 6) {
      setErrorMessage(
        lang === "en"
          ? "Please enter a valid phone number."
          : "Моля, въведете коректен телефон за връзка."
      );
      return;
    }

    if (isTraining && target === "child" && !childAge.trim()) {
      setErrorMessage(
        lang === "en"
          ? "Please specify child's age."
          : "Моля, посочете възрастта на детето."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          target: isTraining ? target : "self",
          childAge: isTraining && target === "child" ? childAge.trim() : null,
          notes:
            notes.trim() ||
            (isProduct ? "Запитване за цена/поръчка от сайта" : null),
          eventId: item.id || null,
          eventTitle: item.name,
          siteId: "bkgalabovo",
        }),
      });

      const resJson = await response.json();

      if (!response.ok) {
        throw new Error(
          resJson.error ||
            (lang === "en"
              ? "Failed to submit inquiry."
              : "Грешка при изпращането на запитването.")
        );
      }

      setIsSuccess(true);
      toast.success(
        lang === "en"
          ? "Inquiry sent successfully!"
          : "Запитването беше изпратено успешно!"
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : lang === "en"
            ? "Submission failed."
            : "Възникна грешка при изпращане.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-lg flex-col overflow-hidden rounded-3xl border border-blue-500/30 bg-zinc-950 p-0 text-white shadow-2xl backdrop-blur-2xl sm:max-w-xl">
        {/* Header */}
        <div className="relative shrink-0 border-b border-zinc-800/80 bg-zinc-900/60 p-5 pr-14 pb-3 sm:p-6 sm:pb-4">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-blue-400 uppercase">
                <MessageSquare className="size-3.5" />
                {isProduct
                  ? lang === "en"
                    ? "Product inquiry"
                    : "Запитване за продукт"
                  : lang === "en"
                    ? "Inquiry"
                    : "Запитване за услуга"}
              </span>
            </div>
            <DialogTitle className="mt-2 text-xl font-bold text-white sm:text-2xl">
              {item.name}
            </DialogTitle>
            <DialogDescription className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
              {showPrice ? (
                <span className="font-semibold text-blue-400">
                  {item.price?.toFixed(2)} EUR
                </span>
              ) : (
                <span className="text-zinc-400 italic">
                  {lang === "en" ? "Price upon request" : "Цена при запитване"}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content Body */}
        <div className="custom-scrollbar flex-1 overflow-y-auto p-5 sm:p-6">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in-95">
              <div className="mb-4 flex size-16 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="size-8" />
              </div>
              <h3 className="text-xl font-bold text-white">
                {lang === "en" ? "Inquiry Sent!" : "Запитването е изпратено!"}
              </h3>
              <p className="mt-2 max-w-sm text-sm text-zinc-400">
                {lang === "en"
                  ? "Thank you! Our club manager has received your inquiry and will contact you shortly."
                  : "Благодарим Ви! Запитването е регистрирано в системата на клуба. Ще се свържем с Вас в най-кратък срок."}
              </p>
              <div className="mt-6 flex justify-center">
                <Button
                  id="catalog-inquiry-success-close-btn"
                  name="catalog-inquiry-success-close-btn"
                  onClick={handleClose}
                  className="rounded-xl bg-blue-600 px-8 font-semibold text-white hover:bg-blue-500"
                >
                  {lang === "en" ? "Close" : "Затвори"}
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                  {errorMessage}
                </div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <label
                  htmlFor="catalog-inquiry-name"
                  className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300"
                >
                  <User className="size-3.5 text-blue-400" />
                  <span>
                    {lang === "en" ? "Name & Family *" : "Име и фамилия *"}
                  </span>
                </label>
                <Input
                  id="catalog-inquiry-name"
                  name="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    lang === "en" ? "e.g. John Doe" : "напр. Иван Иванов"
                  }
                  className="rounded-xl border-zinc-800 bg-zinc-900/60 text-sm text-white placeholder:text-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label
                  htmlFor="catalog-inquiry-phone"
                  className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300"
                >
                  <Phone className="size-3.5 text-blue-400" />
                  <span>
                    {lang === "en" ? "Phone number *" : "Телефон за връзка *"}
                  </span>
                </label>
                <Input
                  id="catalog-inquiry-phone"
                  name="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0899 123 456"
                  className="rounded-xl border-zinc-800 bg-zinc-900/60 text-sm text-white placeholder:text-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Training target if trainings tab */}
              {isTraining && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-zinc-300">
                    {lang === "en" ? "For whom:" : "За кого е запитването:"}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      id="catalog-inquiry-target-self"
                      name="catalog-inquiry-target-self"
                      onClick={() => setTarget("self")}
                      className={`rounded-xl border p-2.5 text-xs font-medium transition-colors ${
                        target === "self"
                          ? "border-blue-500 bg-blue-500/10 text-blue-300"
                          : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      {lang === "en" ? "For me (Adult)" : "За мен (възрастен)"}
                    </button>
                    <button
                      type="button"
                      id="catalog-inquiry-target-child"
                      name="catalog-inquiry-target-child"
                      onClick={() => setTarget("child")}
                      className={`rounded-xl border p-2.5 text-xs font-medium transition-colors ${
                        target === "child"
                          ? "border-blue-500 bg-blue-500/10 text-blue-300"
                          : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      {lang === "en" ? "For child" : "За дете"}
                    </button>
                  </div>

                  {target === "child" && (
                    <div className="space-y-1.5 pt-1">
                      <label
                        htmlFor="catalog-inquiry-child-age"
                        className="text-xs font-semibold text-zinc-300"
                      >
                        {lang === "en" ? "Child age *" : "Възраст на детето *"}
                      </label>
                      <Input
                        id="catalog-inquiry-child-age"
                        name="childAge"
                        required
                        value={childAge}
                        onChange={(e) => setChildAge(e.target.value)}
                        placeholder={
                          lang === "en" ? "e.g. 10 y.o." : "напр. 9 г."
                        }
                        className="rounded-xl border-zinc-800 bg-zinc-900/60 text-sm text-white placeholder:text-zinc-600 focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1.5">
                <label
                  htmlFor="catalog-inquiry-notes"
                  className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300"
                >
                  <MessageSquare className="size-3.5 text-blue-400" />
                  <span>
                    {isProduct
                      ? lang === "en"
                        ? "Questions / Size / Quantity"
                        : "Въпрос за цена, наличност или количество"
                      : lang === "en"
                        ? "Additional notes"
                        : "Допълнителни бележки / Желани часове"}
                  </span>
                </label>
                <Textarea
                  id="catalog-inquiry-notes"
                  name="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={defaultNotePlaceholder}
                  className="resize-none rounded-xl border-zinc-800 bg-zinc-900/60 text-sm text-white placeholder:text-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2">
                <Button
                  id="catalog-inquiry-submit-btn"
                  name="catalog-inquiry-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      {lang === "en" ? "Submitting..." : "Изпращане..."}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Send className="size-4" />
                      {showPrice
                        ? lang === "en"
                          ? "Send Request"
                          : "Изпрати заявка"
                        : lang === "en"
                          ? "Ask for Price"
                          : "Попитай за цена"}
                    </span>
                  )}
                </Button>

                <div className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-zinc-500">
                  <span>
                    {lang === "en"
                      ? "Inquiries are registered directly in our club system."
                      : "Запитванията се регистрират директно в системата на клуба."}
                  </span>
                </div>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
