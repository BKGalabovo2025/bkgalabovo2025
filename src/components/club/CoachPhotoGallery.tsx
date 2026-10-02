"use client";

import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  User as UserIcon,
  X,
} from "lucide-react";
import Image from "next/image";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { getValidImageSrc } from "@/components/club/ShareAthleteDialog";
import { Therapist } from "@/types/site.types";

interface CoachPhotoGalleryProps {
  coach: Therapist;
  className?: string;
  children?: React.ReactNode;
}

interface PhotoItem {
  url: string;
  caption?: string;
  isPrimary?: boolean;
}

export function CoachPhotoGallery({
  coach,
  className = "",
  children,
}: CoachPhotoGalleryProps) {
  // Lightbox state: active photo index, or null if closed
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const filmstripRef = useRef<HTMLDivElement>(null);

  // 1. Resolve Primary Image
  const primaryUrl = useMemo(() => {
    if (coach.image && coach.image.trim()) {
      return getValidImageSrc(coach.image.trim());
    }
    if (coach.photos && coach.photos.length > 0) {
      const firstValid = coach.photos.find((p) => p.url && p.url.trim());
      if (firstValid) return getValidImageSrc(firstValid.url.trim());
    }
    return "";
  }, [coach.image, coach.photos]);

  // 2. Resolve All Public Photos (Primary first, then unique public photos)
  const allPhotos: PhotoItem[] = useMemo(() => {
    const list: PhotoItem[] = [];
    const seen = new Set<string>();

    if (primaryUrl) {
      seen.add(primaryUrl);
      list.push({
        url: primaryUrl,
        caption: "Главна снимка",
        isPrimary: true,
      });
    }

    if (coach.photos && coach.photos.length > 0) {
      coach.photos
        .filter((p) => p.isPublic !== false && p.url && p.url.trim())
        .forEach((p) => {
          const valid = getValidImageSrc(p.url.trim());
          if (valid && !seen.has(valid)) {
            seen.add(valid);
            list.push({
              url: valid,
              caption: p.caption,
              isPrimary: false,
            });
          }
        });
    }

    return list;
  }, [primaryUrl, coach.photos]);

  // 3. Additional photos (All photos except primary) for preview strip
  const additionalPhotos = useMemo(() => {
    return allPhotos.filter((p) => !p.isPrimary);
  }, [allPhotos]);

  // Maximum thumbnails to display in the card before "+X" badge
  const MAX_PREVIEW_THUMBS = 4;
  const visibleThumbs = additionalPhotos.slice(0, MAX_PREVIEW_THUMBS);
  const remainingCount = additionalPhotos.length - (MAX_PREVIEW_THUMBS - 1);

  // Keyboard navigation inside lightbox
  const isOpen = lightboxIndex !== null;
  const activeIndex = lightboxIndex ?? 0;
  const activePhoto = allPhotos[activeIndex] || allPhotos[0];

  const handlePrev = useCallback(() => {
    setLightboxIndex((prev) => {
      if (prev === null) return 0;
      return prev === 0 ? allPhotos.length - 1 : prev - 1;
    });
  }, [allPhotos.length]);

  const handleNext = useCallback(() => {
    setLightboxIndex((prev) => {
      if (prev === null) return 0;
      return prev === allPhotos.length - 1 ? 0 : prev + 1;
    });
  }, [allPhotos.length]);

  const handleClose = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose, handlePrev, handleNext]);

  // Scroll active thumbnail into view in filmstrip
  useEffect(() => {
    if (!isOpen || !filmstripRef.current) return;
    const activeEl = filmstripRef.current.children[activeIndex] as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [isOpen, activeIndex]);

  const handleOpenLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  return (
    <>
      <div
        className={`relative flex w-full flex-col items-center text-center ${className}`}
      >
        {/* Main Coach Avatar / Featured Photo */}
        <div className="relative mb-3 sm:mb-4">
          {primaryUrl ? (
            <div
              onClick={() => handleOpenLightbox(0)}
              title="Кликнете за преглед на цял екран"
              className="group/avatar relative size-28 cursor-pointer overflow-hidden rounded-full border-2 border-zinc-800 bg-zinc-900 shadow-xl transition-all duration-300 hover:scale-105 hover:border-blue-500/80 hover:shadow-[0_0_20px_rgba(59,130,246,0.25)] sm:size-32"
            >
              <Image
                src={primaryUrl}
                alt={coach.name}
                fill
                sizes="128px"
                unoptimized
                className="object-cover transition-transform duration-500 group-hover/avatar:scale-105"
              />
              {/* Fullscreen icon on hover */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover/avatar:opacity-100">
                <Maximize2 className="size-5 text-white drop-shadow-md" />
              </div>

              {/* Total photos badge */}
              {allPhotos.length > 1 && (
                <div className="absolute inset-x-0 bottom-1.5 mx-auto flex w-fit items-center gap-1 rounded-full border border-white/20 bg-black/80 px-2 py-0.5 text-[9px] font-semibold text-white shadow-lg backdrop-blur-md">
                  <Camera className="size-2.5 text-blue-400" />
                  <span>{allPhotos.length} снимки</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex size-28 items-center justify-center rounded-full border-2 border-zinc-800 bg-zinc-900 text-zinc-700 shadow-xl sm:size-32">
              <UserIcon size={44} />
            </div>
          )}
        </div>

        {/* Coach Details (Name, Role, Bio passed as children) */}
        {children}

        {/* Compact Preview Strip (Only when additional photos exist) */}
        {additionalPhotos.length > 0 && (
          <div className="mt-4 w-full border-t border-zinc-800/60 pt-4">
            {/* Row of 4 thumbnails with "+X" badge on the last one */}
            <div className="flex items-center justify-center gap-2">
              {visibleThumbs.map((photo, idx) => {
                // Corresponding index in allPhotos (primary is index 0, so additional is idx + 1)
                const targetIndex = idx + 1;
                const isLastWithMore =
                  idx === MAX_PREVIEW_THUMBS - 1 && remainingCount > 0;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleOpenLightbox(targetIndex)}
                    title={
                      isLastWithMore
                        ? `Виж още ${remainingCount} снимки`
                        : photo.caption || `Снимка ${targetIndex}`
                    }
                    className="group/thumb relative size-14 cursor-pointer overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-900 shadow-md transition-all duration-300 hover:scale-108 hover:border-blue-400 hover:shadow-[0_0_15px_rgba(96,165,250,0.3)] active:scale-95 sm:size-16"
                  >
                    <Image
                      src={photo.url}
                      alt={`${coach.name} миниатюра ${idx + 1}`}
                      fill
                      sizes="64px"
                      unoptimized
                      className="object-cover transition-transform duration-500 group-hover/thumb:scale-110"
                    />

                    {isLastWithMore ? (
                      /* "+X още" Overlay on 4th thumbnail */
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 backdrop-blur-[1px] transition-colors group-hover/thumb:bg-black/60">
                        <span className="text-xs font-bold text-white drop-shadow-md sm:text-sm">
                          +{remainingCount}
                        </span>
                        <span className="text-[9px] font-medium text-blue-300">
                          още
                        </span>
                      </div>
                    ) : (
                      /* Regular hover zoom icon */
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-[1px] transition-opacity duration-200 group-hover/thumb:opacity-100">
                        <Maximize2 className="size-4 text-white drop-shadow-md" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Pill Button: "Разгледай галерия (N снимки)" */}
            <div className="mt-3.5">
              <button
                type="button"
                onClick={() => handleOpenLightbox(0)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-400 transition-all duration-300 hover:scale-103 hover:border-blue-500/60 hover:bg-blue-500/20 hover:text-white hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] active:scale-95"
              >
                <Camera className="size-3.5" />
                <span>Разгледай галерия ({allPhotos.length} снимки)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Luxury Fullscreen Lightbox / Carousel Modal */}
      {isOpen && activePhoto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 p-4 backdrop-blur-xl transition-all sm:p-6"
        >
          {/* Top Bar: Title, Counter, Actions */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-white">
                  {coach.name}
                </span>
                <span className="rounded-full border border-blue-500/30 bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-300">
                  {coach.role || "Треньор"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-zinc-400">
                {activePhoto.caption ||
                  (activePhoto.isPrimary
                    ? "Главна профилна снимка"
                    : `Снимка ${activeIndex + 1} от ${allPhotos.length}`)}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Counter Badge */}
              <div className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-zinc-200">
                {activeIndex + 1} / {allPhotos.length}
              </div>

              {/* Download Button */}
              <a
                href={activePhoto.url}
                download
                target="_blank"
                rel="noopener noreferrer"
                title="Свали снимката"
                className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-zinc-300 transition-colors hover:bg-white/20 hover:text-white"
              >
                <Download className="size-4" />
              </a>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleClose}
                title="Затвори (Esc)"
                className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-all hover:scale-105 hover:bg-rose-600"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Center Stage: Photo with Prev/Next Controls */}
          <div className="relative flex flex-1 items-center justify-center overflow-hidden py-4">
            {/* Prev Button */}
            {allPhotos.length > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Предишна снимка"
                className="absolute left-2 z-20 flex size-12 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/60 text-white shadow-2xl backdrop-blur-md transition-all hover:scale-110 hover:bg-blue-600 sm:left-6"
              >
                <ChevronLeft className="size-6" />
              </button>
            )}

            {/* Current Image */}
            <div className="relative flex max-h-[65vh] w-full max-w-5xl items-center justify-center">
              <Image
                src={activePhoto.url}
                alt={`${coach.name} снимка ${activeIndex + 1}`}
                width={1200}
                height={800}
                unoptimized
                className="max-h-[65vh] w-auto max-w-[90vw] rounded-2xl object-contain shadow-2xl"
              />
            </div>

            {/* Next Button */}
            {allPhotos.length > 1 && (
              <button
                type="button"
                onClick={handleNext}
                aria-label="Следваща снимка"
                className="absolute right-2 z-20 flex size-12 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/60 text-white shadow-2xl backdrop-blur-md transition-all hover:scale-110 hover:bg-blue-600 sm:right-6"
              >
                <ChevronRight className="size-6" />
              </button>
            )}
          </div>

          {/* Bottom Filmstrip: All Photos Thumbnails */}
          {allPhotos.length > 1 && (
            <div className="border-t border-white/10 pt-3">
              <div
                ref={filmstripRef}
                className="flex items-center justify-start gap-2.5 overflow-x-auto py-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-700 sm:justify-center"
              >
                {allPhotos.map((photo, idx) => {
                  const isActive = idx === activeIndex;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setLightboxIndex(idx)}
                      className={`relative size-14 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 transition-all sm:size-16 ${
                        isActive
                          ? "scale-105 border-blue-500 opacity-100 shadow-[0_0_15px_rgba(59,130,246,0.6)] ring-2 ring-blue-500/50"
                          : "border-zinc-800 opacity-50 hover:border-zinc-500 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={photo.url}
                        alt={`Миниатюра ${idx + 1}`}
                        fill
                        sizes="64px"
                        unoptimized
                        className="object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
