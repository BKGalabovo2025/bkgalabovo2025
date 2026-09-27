"use client";

import { Camera, Maximize2, User as UserIcon } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";

import { getValidImageSrc } from "@/components/club/ShareAthleteDialog";
import { DocumentViewerDialog } from "@/components/schedule/DocumentViewerDialog";
import { Therapist } from "@/types/site.types";

interface CoachPhotoGalleryProps {
  coach: Therapist;
  className?: string;
  children?: React.ReactNode;
}

interface PreviewItem {
  url: string;
  title: string;
  subtitle?: string;
}

export function CoachPhotoGallery({
  coach,
  className = "",
  children,
}: CoachPhotoGalleryProps) {
  const [previewPhoto, setPreviewPhoto] = useState<PreviewItem | null>(null);

  // 1. Resolve Primary Image
  const primaryPhoto = React.useMemo(() => {
    if (coach.image && coach.image.trim()) {
      return getValidImageSrc(coach.image.trim());
    }
    if (coach.photos && coach.photos.length > 0) {
      const firstValid = coach.photos.find((p) => p.url && p.url.trim());
      if (firstValid) return getValidImageSrc(firstValid.url.trim());
    }
    return "";
  }, [coach.image, coach.photos]);

  // 2. Resolve Additional Photos (All photos EXCEPT the primary one)
  const additionalPhotos = React.useMemo(() => {
    if (!coach.photos || coach.photos.length === 0) return [];

    const result: { url: string; caption?: string }[] = [];
    const seen = new Set<string>();

    // Mark primary as seen so it's excluded from miniatures
    if (primaryPhoto) {
      seen.add(primaryPhoto);
    }

    coach.photos
      .filter((p) => p.isPublic !== false && p.url && p.url.trim())
      .forEach((p) => {
        const validSrc = getValidImageSrc(p.url.trim());
        if (validSrc && !seen.has(validSrc)) {
          seen.add(validSrc);
          result.push({
            url: validSrc,
            caption: p.caption,
          });
        }
      });

    return result;
  }, [coach.photos, primaryPhoto]);

  const handleOpenPrimary = () => {
    if (!primaryPhoto) return;
    setPreviewPhoto({
      url: primaryPhoto,
      title: `${coach.name} (Главна снимка)`,
      subtitle: coach.role || "Треньор",
    });
  };

  const handleOpenThumbnail = (url: string, caption?: string, idx?: number) => {
    const photoNumber = (idx ?? 0) + 1;
    const photoTitle = caption || `Снимка ${photoNumber}`;
    setPreviewPhoto({
      url,
      title: `${coach.name} — ${photoTitle}`,
      subtitle: coach.role || "Треньор",
    });
  };

  return (
    <>
      <div
        className={`relative flex w-full flex-col items-center text-center ${className}`}
      >
        {/* Main Coach Avatar / Featured Photo */}
        <div className="relative mb-6">
          {primaryPhoto ? (
            <div
              onClick={handleOpenPrimary}
              title="Кликнете за преглед на цял екран"
              className="group/avatar relative size-44 cursor-pointer overflow-hidden rounded-full border-2 border-zinc-800 bg-zinc-900 shadow-2xl transition-all duration-300 hover:scale-105 hover:border-blue-500/80 hover:shadow-[0_0_30px_rgba(59,130,246,0.25)]"
            >
              <Image
                src={primaryPhoto}
                alt={coach.name}
                fill
                sizes="176px"
                unoptimized
                className="object-cover transition-transform duration-500 group-hover/avatar:scale-105"
              />
              {/* Fullscreen icon on hover */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover/avatar:opacity-100">
                <Maximize2 className="size-6 text-white drop-shadow-md" />
              </div>

              {/* Miniature counter badge if extra photos exist */}
              {additionalPhotos.length > 0 && (
                <div className="absolute bottom-2 inset-x-0 mx-auto w-fit rounded-full border border-white/20 bg-black/80 px-2 py-0.5 text-[10px] font-semibold text-white shadow-lg backdrop-blur-md">
                  +{additionalPhotos.length}{" "}
                  {additionalPhotos.length === 1 ? "снимка" : "снимки"}
                </div>
              )}
            </div>
          ) : (
            <div className="flex size-44 items-center justify-center rounded-full border-2 border-zinc-800 bg-zinc-900 text-zinc-700 shadow-2xl">
              <UserIcon size={64} />
            </div>
          )}
        </div>

        {/* Coach Details (Name, Role, Bio passed as children) */}
        {children}

        {/* Miniature Thumbnails Section (All photos except primary) */}
        {additionalPhotos.length > 0 && (
          <div className="mt-2 w-full border-t border-zinc-800/60 pt-4">
            <div className="mb-3 flex items-center justify-between px-2 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-zinc-300">
                <Camera className="size-3.5 text-blue-400" />
                Галерия ({additionalPhotos.length})
              </span>
              <span className="text-[10px] text-zinc-500">
                кликнете за пълен размер
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {additionalPhotos.map((photo, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    handleOpenThumbnail(photo.url, photo.caption, idx)
                  }
                  title={photo.caption || `Преглед на снимка ${idx + 1}`}
                  className="group/thumb relative size-16 cursor-pointer overflow-hidden rounded-2xl border-2 border-zinc-800/90 bg-zinc-900 shadow-md transition-all duration-300 hover:scale-108 hover:border-blue-400 hover:shadow-[0_0_20px_rgba(96,165,250,0.3)] active:scale-95 sm:size-18"
                >
                  <Image
                    src={photo.url}
                    alt={`${coach.name} миниатюра ${idx + 1}`}
                    fill
                    sizes="72px"
                    unoptimized
                    className="object-cover transition-transform duration-500 group-hover/thumb:scale-110"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-[1px] transition-opacity duration-200 group-hover/thumb:opacity-100">
                    <Maximize2 className="size-4 text-white drop-shadow-md" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox / Fullscreen Viewer */}
      {previewPhoto && (
        <DocumentViewerDialog
          isOpen={Boolean(previewPhoto)}
          onClose={() => setPreviewPhoto(null)}
          documentUrl={previewPhoto.url}
          documentName={previewPhoto.title}
          documentType="image"
          subtitle={previewPhoto.subtitle}
        />
      )}
    </>
  );
}
