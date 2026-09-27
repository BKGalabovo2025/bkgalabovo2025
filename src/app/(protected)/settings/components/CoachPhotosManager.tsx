"use client";

import { Check, Eye, ImageIcon, Plus, Star, Trash2 } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";

import { getValidImageSrc } from "@/components/club/ShareAthleteDialog";
import { DocumentViewerDialog } from "@/components/schedule/DocumentViewerDialog";
import { UniversalMediaUpload } from "@/components/shared/media/UniversalMediaUpload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Therapist, TherapistPhoto } from "@/types/site.types";

interface CoachPhotosManagerProps {
  coach: Therapist;
  onUpdateField: (
    field: "image" | "photos",
    value: string | boolean | TherapistPhoto[]
  ) => void;
  storageFolder?: string;
  idPrefix: string;
}

export function CoachPhotosManager({
  coach,
  onUpdateField,
  storageFolder = "team/bkgalabovo",
  idPrefix,
}: CoachPhotosManagerProps) {
  const [showUploader, setShowUploader] = useState(false);
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

  const publicCount = photos.filter((p) => p.isPublic !== false).length;
  const allMarkedPublic = photos.length > 0 && publicCount === photos.length;

  // Add new photo
  const handleAddPhoto = (newUrl: string) => {
    if (!newUrl || !newUrl.trim()) return;
    const cleanUrl = newUrl.trim();

    // Avoid duplicates
    if (photos.some((p) => p.url === cleanUrl)) {
      setShowUploader(false);
      return;
    }

    const updated = [...photos, { url: cleanUrl, isPublic: true }];
    onUpdateField("photos", updated);

    // If no primary image set, set this one
    if (!coach.image || !coach.image.trim()) {
      onUpdateField("image", cleanUrl);
    }
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
    // Ensure primary image is marked public
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

    // If we removed the primary image, update primary to the first available
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
    <div className="space-y-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
      {/* Header and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <ImageIcon className="size-4 text-primary" />
            <Label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Галерия от снимки на треньора
            </Label>
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/10 text-xs font-semibold text-primary"
            >
              {photos.length} {photos.length === 1 ? "снимка" : "снимки"}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Качете една или повече снимки. Можете да изберете кои да се виждат
            на публичната страница.
          </p>
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
            <Plus className="mr-1.5 size-3.5" />
            {showUploader ? "Затвори формата" : "Добави нова снимка"}
          </Button>
        </div>
      </div>

      {/* Uploader Form (when active) */}
      {showUploader && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 transition-all">
          <UniversalMediaUpload
            id={`${idPrefix}-uploader`}
            label="Качи нова снимка за треньора"
            description="Drag & Drop от телефон/компютър (автоматична WebP компресия) или постави външен линк"
            value=""
            onChange={handleAddPhoto}
            storageFolder={storageFolder}
            placeholderUrl="/team/mira-training.jpg или https://..."
          />
        </div>
      )}

      {/* Photos Grid */}
      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 py-8 text-center dark:border-zinc-800">
          <ImageIcon className="size-8 text-zinc-400" />
          <p className="mt-2 text-sm text-zinc-500">
            Все още няма качени снимки за този треньор.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowUploader(true)}
            className="mt-3 h-8 rounded-xl text-xs"
          >
            <Plus className="mr-1.5 size-3.5" /> Качи първа снимка
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {photos.map((photo, idx) => {
            const isPrimary = photo.url === primaryImage;
            const isVisible = photo.isPublic !== false;
            const validSrc = getValidImageSrc(photo.url);

            return (
              <div
                key={idx}
                className={`group relative flex flex-col overflow-hidden rounded-xl border bg-white p-3 shadow-xs transition-all dark:bg-zinc-950 ${
                  isPrimary
                    ? "border-primary ring-1 ring-primary/40"
                    : "border-zinc-200 dark:border-zinc-800"
                }`}
              >
                {/* Photo Thumbnail */}
                <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg bg-zinc-900">
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

                  {/* Primary Badge */}
                  {isPrimary && (
                    <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                      <Star className="size-3 fill-white" />
                      <span>Главна</span>
                    </div>
                  )}

                  {/* View Button Overlay */}
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
                <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2.5 dark:border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`${idPrefix}-public-${idx}`}
                      checked={isVisible}
                      onCheckedChange={() => handleTogglePublic(idx)}
                    />
                    <label
                      htmlFor={`${idPrefix}-public-${idx}`}
                      className="cursor-pointer text-xs font-medium text-zinc-700 select-none dark:text-zinc-300"
                    >
                      Видима в сайта
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

                <div className="mt-1 truncate text-[10px] text-zinc-400">
                  {photo.url}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
    </div>
  );
}
