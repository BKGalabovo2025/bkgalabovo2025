"use client";

import {
  Check,
  Eye,
  ImageIcon,
  Link as LinkIcon,
  Loader2,
  Plus,
  Star,
  Trash2,
  UploadCloud,
  User as UserIcon,
  X,
} from "lucide-react";
import Image from "next/image";
import React, { useId, useRef, useState } from "react";
import { toast } from "react-hot-toast";

import { getValidImageSrc } from "@/components/club/ShareAthleteDialog";
import { DocumentViewerDialog } from "@/components/schedule/DocumentViewerDialog";
import { compressImageIfNeeded } from "@/components/shared/media/UniversalMediaUpload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getSiteConfig } from "@/config/sites";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import { uploadFile } from "@/services/storage-service";
import { Therapist, TherapistPhoto } from "@/types/site.types";

const getProgressWidthClass = (curr: number, tot: number): string => {
  if (tot <= 0) return "w-0";
  const pct = (curr / tot) * 100;
  if (pct >= 100) return "w-full";
  if (pct >= 85) return "w-5/6";
  if (pct >= 75) return "w-3/4";
  if (pct >= 60) return "w-3/5";
  if (pct >= 50) return "w-1/2";
  if (pct >= 35) return "w-1/3";
  if (pct >= 25) return "w-1/4";
  return "w-1/6";
};

interface CoachPhotosManagerProps {
  coach: Therapist;
  onUpdateField: (
    field: "image" | "photos",
    value: string | boolean | TherapistPhoto[]
  ) => void;
  storageFolder?: string;
  idPrefix: string;
}

interface UploadProgress {
  current: number;
  total: number;
  fileName: string;
}

export function CoachPhotosManager({
  coach,
  onUpdateField,
  storageFolder = "team/bkgalabovo",
  idPrefix,
}: CoachPhotosManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const linksTextareaId = useId();
  const { idToken } = useAuth();

  // Modal open state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Uploader state inside modal
  const [showUploader, setShowUploader] = useState(false);
  const [uploaderTab, setUploaderTab] = useState<"files" | "links">("files");
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null
  );
  const [linksInput, setLinksInput] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Normalize photos list: if photos is empty but coach.image exists, initialize with it
  const photos: TherapistPhoto[] = React.useMemo(() => {
    if (coach.photos && coach.photos.length > 0) {
      return coach.photos;
    }
    if (coach.image && coach.image.trim()) {
      return [{ url: coach.image.trim(), isPublic: true }];
    }
    return [];
  }, [coach.photos, coach.image]);

  const primaryImage =
    coach.image?.trim() || (photos.length > 0 ? photos[0].url : "");
  const primaryValidSrc = getValidImageSrc(primaryImage);

  const publicCount = photos.filter((p) => p.isPublic !== false).length;
  const allMarkedPublic = photos.length > 0 && publicCount === photos.length;

  // Process batch files upload
  const handleUploadMultipleFiles = async (filesList: FileList | File[]) => {
    const validFiles = Array.from(filesList).filter((f) =>
      f.type.startsWith("image/")
    );
    if (validFiles.length === 0) {
      toast.error("Моля, изберете валидни графични файлове (PNG, JPG, WEBP).");
      return;
    }

    const newUploadedPhotos: TherapistPhoto[] = [];
    const siteId = getSiteConfig().id;

    for (let i = 0; i < validFiles.length; i++) {
      const rawFile = validFiles[i];
      setUploadProgress({
        current: i + 1,
        total: validFiles.length,
        fileName: rawFile.name,
      });

      try {
        const compressed = await compressImageIfNeeded(rawFile, 1024 * 1024);
        const safeName = compressed.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storagePath = `sites/${siteId}/${storageFolder}/${Date.now()}_${safeName}`;

        const downloadUrl = await uploadFile(storagePath, compressed, idToken);
        if (downloadUrl) {
          newUploadedPhotos.push({
            url: downloadUrl,
            isPublic: true,
          });
        }
      } catch (err) {
        console.error(`Error uploading ${rawFile.name}:`, err);
        toast.error(`Грешка при качване на ${rawFile.name}`);
      }
    }

    setUploadProgress(null);

    if (newUploadedPhotos.length > 0) {
      const existingUrls = new Set(photos.map((p) => p.url));
      const filteredNew = newUploadedPhotos.filter(
        (p) => !existingUrls.has(p.url)
      );
      const updated = [...photos, ...filteredNew];
      onUpdateField("photos", updated);

      if (!coach.image || !coach.image.trim()) {
        onUpdateField("image", filteredNew[0].url);
      }

      toast.success(
        `Успешно качени ${filteredNew.length} снимки към галерията!`
      );
      setShowUploader(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUploadMultipleFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadMultipleFiles(e.dataTransfer.files);
    }
  };

  // Add multiple links batch
  const handleAddLinksBatch = () => {
    if (!linksInput.trim()) return;

    const rawTokens = linksInput
      .split(/[\n,]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    const existingUrls = new Set(photos.map((p) => p.url));
    const newItems: TherapistPhoto[] = [];

    for (const token of rawTokens) {
      const cleanUrl = getValidImageSrc(token);
      if (cleanUrl && !existingUrls.has(cleanUrl)) {
        existingUrls.add(cleanUrl);
        newItems.push({
          url: cleanUrl,
          isPublic: true,
        });
      }
    }

    if (newItems.length === 0) {
      toast.error("Всички въведени линкове вече съществуват или са невалидни.");
      return;
    }

    const updated = [...photos, ...newItems];
    onUpdateField("photos", updated);

    if (!coach.image || !coach.image.trim()) {
      onUpdateField("image", newItems[0].url);
    }

    toast.success(`Успешно добавени ${newItems.length} снимки!`);
    setLinksInput("");
    setShowUploader(false);
  };

  // Toggle public visibility for a specific photo
  const handleTogglePublic = (index: number) => {
    const updated = photos.map((p, idx) =>
      idx === index ? { ...p, isPublic: p.isPublic === false } : p
    );
    onUpdateField("photos", updated);
  };

  // Set as primary image
  const handleSetPrimary = (url: string) => {
    onUpdateField("image", url);
    const updated = photos.map((p) =>
      p.url === url ? { ...p, isPublic: true } : p
    );
    onUpdateField("photos", updated);
  };

  // Remove photo
  const handleRemovePhoto = (index: number) => {
    const photoToRemove = photos[index];
    const updated = photos.filter((_, idx) => idx !== index);
    onUpdateField("photos", updated);

    if (photoToRemove.url === primaryImage) {
      const nextPrimary = updated.length > 0 ? updated[0].url : "";
      onUpdateField("image", nextPrimary);
    }
  };

  // Master toggle: mark all visible / hide all
  const handleToggleAll = () => {
    const targetState = !allMarkedPublic;
    const updated = photos.map((p) => ({ ...p, isPublic: targetState }));
    onUpdateField("photos", updated);
  };

  return (
    <>
      {/* 1. COMPACT FORM CARD (Takes only 1 neat row in Settings!) */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-4 transition-colors sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="flex items-center gap-3.5">
          {/* Avatar Preview */}
          <div className="relative size-14 shrink-0 overflow-hidden rounded-full border-2 border-zinc-300 bg-zinc-900 shadow-xs sm:size-16 dark:border-zinc-700">
            {primaryValidSrc ? (
              <Image
                src={primaryValidSrc}
                alt={coach.name}
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-zinc-500">
                <UserIcon className="size-8" />
              </div>
            )}
          </div>

          {/* Info & Stats */}
          <div>
            <div className="flex items-center gap-2">
              <Label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Снимки и галерия на треньора
              </Label>
              <Badge
                variant="outline"
                className="border-primary/30 bg-primary/10 text-xs font-semibold text-primary"
              >
                {photos.length} {photos.length === 1 ? "снимка" : "снимки"}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {publicCount} от {photos.length} видими в публичния сайт • Главна
              снимка е зададена
            </p>
          </div>
        </div>

        {/* Action Button: Opens the Management Dialog */}
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsModalOpen(true)}
            className="h-9 w-full rounded-xl border-primary/30 px-4 text-xs font-semibold text-primary hover:bg-primary/10 sm:w-auto"
          >
            <ImageIcon className="mr-1.5 size-4" />
            Управление на галерията ({photos.length})
          </Button>
        </div>
      </div>

      {/* 2. DEDICATED MANAGEMENT DIALOG (Spacious, clean, modal) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden p-6 sm:rounded-3xl">
          {/* Hidden multi-file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/jpg"
            onChange={handleFileInputChange}
            className="hidden"
          />

          <DialogHeader className="border-b border-zinc-100 pb-3 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <ImageIcon className="size-5 text-primary" />
              <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Фотогалерия — {coach.name}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-zinc-500">
              Качвайте множество снимки едновременно, маркирайте кои да се
              виждат на сайта и изберете водещ аватар.
            </DialogDescription>
          </DialogHeader>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-primary/30 bg-primary/10 text-xs font-semibold text-primary"
              >
                {photos.length} общо
              </Badge>
              <span className="text-xs text-zinc-500">
                ({publicCount} видими в сайта)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {photos.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleToggleAll}
                  className="h-8 rounded-xl text-xs font-medium"
                >
                  <Check className="mr-1.5 size-3.5 text-emerald-500" />
                  {allMarkedPublic
                    ? "Скрий всички от сайта"
                    : "Маркирай всички за сайта"}
                </Button>
              )}

              <Button
                type="button"
                variant={showUploader ? "secondary" : "default"}
                size="sm"
                onClick={() => setShowUploader(!showUploader)}
                className="h-8 rounded-xl text-xs font-medium"
              >
                {showUploader ? (
                  <>
                    <X className="mr-1.5 size-3.5" /> Затвори ъплоудера
                  </>
                ) : (
                  <>
                    <Plus className="mr-1.5 size-3.5" /> Добави снимки
                    (множествен избор)
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Batch Uploader Panel (Collapsible inside modal) */}
          {showUploader && (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 transition-all">
              <div className="flex items-center justify-between border-b border-primary/10 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setUploaderTab("files")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      uploaderTab === "files"
                        ? "bg-primary text-white shadow-xs"
                        : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    }`}
                  >
                    <UploadCloud className="mr-1.5 inline-block size-3.5" />
                    Качи файлове наведнъж
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploaderTab("links")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      uploaderTab === "links"
                        ? "bg-primary text-white shadow-xs"
                        : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    }`}
                  >
                    <LinkIcon className="mr-1.5 inline-block size-3.5" />
                    Постави външни линкове
                  </button>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUploader(false)}
                  className="size-7 p-0 text-zinc-400 hover:text-zinc-600"
                >
                  <X className="size-4" />
                </Button>
              </div>

              {/* Tab 1: Multi-file picker */}
              {uploaderTab === "files" && (
                <div className="pt-3">
                  {uploadProgress ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-primary/30 bg-white/60 p-6 text-center backdrop-blur-xs dark:bg-zinc-950/60">
                      <Loader2 className="size-8 animate-spin text-primary" />
                      <p className="mt-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                        Качване на снимка {uploadProgress.current} от{" "}
                        {uploadProgress.total}...
                      </p>
                      <p className="mt-1 max-w-xs truncate text-xs text-zinc-500">
                        {uploadProgress.fileName}
                      </p>
                      <div className="mt-4 h-2 w-full max-w-md overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                        <div
                          className={cn(
                            "h-full bg-primary transition-all duration-300",
                            getProgressWidthClass(
                              uploadProgress.current,
                              uploadProgress.total
                            )
                          )}
                        />
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all ${
                        isDragOver
                          ? "border-primary bg-primary/10 shadow-inner"
                          : "border-zinc-300 bg-white/40 hover:border-primary/60 hover:bg-white/80 dark:border-zinc-700 dark:bg-zinc-900/30"
                      }`}
                    >
                      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <UploadCloud className="size-6" />
                      </div>
                      <h4 className="mt-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                        Плъзнете няколко снимки тук или кликнете за избор
                      </h4>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        Поддържа маркиране на множество файлове едновременно
                        (PNG, JPG, WEBP).
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        className="mt-3 h-8 rounded-xl px-4 text-xs font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                      >
                        Избери файлове от компютър
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Multiple links */}
              {uploaderTab === "links" && (
                <div className="space-y-3 pt-3">
                  <Label
                    htmlFor={linksTextareaId}
                    className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Въведете един или няколко линка (по един на ред или
                    разделени със запетая):
                  </Label>
                  <textarea
                    id={linksTextareaId}
                    rows={3}
                    value={linksInput}
                    onChange={(e) => setLinksInput(e.target.value)}
                    placeholder="public\team\mira georgieva.jpg&#10;/team/photo-2.jpg&#10;https://..."
                    className="w-full rounded-xl border border-zinc-300 bg-white p-3 font-mono text-xs text-zinc-800 focus:border-primary focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500">
                      Автоматично разпознава и нормализира пътища.
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddLinksBatch}
                      className="h-8 rounded-xl text-xs font-medium"
                    >
                      <Plus className="mr-1.5 size-3.5" /> Добави линковете
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Scrollable Photos Grid inside Modal */}
          <div className="flex-1 overflow-y-auto pr-1">
            {photos.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 py-12 text-center dark:border-zinc-800">
                <ImageIcon className="size-10 text-zinc-400" />
                <p className="mt-3 text-sm text-zinc-500">
                  Все още няма качени снимки за този треньор.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUploader(true)}
                  className="mt-3 h-8 rounded-xl text-xs"
                >
                  <Plus className="mr-1.5 size-3.5" /> Качи първи снимки
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3">
                {photos.map((photo, idx) => {
                  const isPrimary = photo.url === primaryImage;
                  const isVisible = photo.isPublic !== false;
                  const validSrc = getValidImageSrc(photo.url);

                  return (
                    <div
                      key={idx}
                      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white p-2.5 shadow-xs transition-all dark:bg-zinc-950 ${
                        isPrimary
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-zinc-200 dark:border-zinc-800"
                      }`}
                    >
                      {/* Photo Thumbnail */}
                      <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-zinc-900">
                        {validSrc ? (
                          <Image
                            src={validSrc}
                            alt={`${coach.name} снимка ${idx + 1}`}
                            fill
                            unoptimized
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-zinc-600">
                            <ImageIcon className="size-8" />
                          </div>
                        )}

                        {/* Primary Star Badge */}
                        {isPrimary && (
                          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                            <Star className="size-3 fill-white" />
                            <span>Главна</span>
                          </div>
                        )}

                        {/* Fullscreen view button */}
                        <button
                          type="button"
                          onClick={() => setPreviewUrl(validSrc)}
                          title="Преглед на цял екран"
                          className="absolute top-2 right-2 z-10 flex size-7 items-center justify-center rounded-lg border border-white/20 bg-black/60 text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100 hover:bg-blue-600"
                        >
                          <Eye className="size-3.5" />
                        </button>
                      </div>

                      {/* Controls Bar */}
                      <div className="mt-2.5 flex items-center justify-between border-t border-zinc-100 pt-2 dark:border-zinc-800/80">
                        <div className="flex items-center gap-1.5">
                          <Checkbox
                            id={`${idPrefix}-modal-public-${idx}`}
                            checked={isVisible}
                            onCheckedChange={() => handleTogglePublic(idx)}
                          />
                          <label
                            htmlFor={`${idPrefix}-modal-public-${idx}`}
                            className="cursor-pointer text-xs font-medium text-zinc-700 select-none dark:text-zinc-300"
                          >
                            Видима
                          </label>
                        </div>

                        <div className="flex items-center gap-1">
                          {!isPrimary && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              title="Направи главна снимка"
                              onClick={() => handleSetPrimary(photo.url)}
                              className="h-7 px-2 text-[11px] text-zinc-500 hover:text-primary"
                            >
                              <Star className="mr-1 size-3" /> Главна
                            </Button>
                          )}

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            title="Изтрий снимката"
                            onClick={() => handleRemovePhoto(idx)}
                            className="size-7 p-0 text-red-500 hover:bg-red-500/10 hover:text-red-600"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dialog Footer */}
          <DialogFooter className="flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <p className="text-xs text-zinc-500">
              {photos.length} снимки в галерията ({publicCount} видими в сайта)
            </p>
            <Button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="h-9 rounded-xl px-5 text-xs font-semibold"
            >
              Запази и затвори
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox / Fullscreen Preview Modal */}
      {previewUrl && (
        <DocumentViewerDialog
          isOpen={Boolean(previewUrl)}
          onClose={() => setPreviewUrl(null)}
          documentUrl={previewUrl}
          documentName={`Снимка на ${coach.name}`}
          documentType="image"
          subtitle="Преглед на изображението"
        />
      )}
    </>
  );
}
