"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageGalleryProps {
  images: string[];
  displayMode: string;
  altName: string;
  fallbackIcon: React.ReactNode;
  fallbackText: string;
  cleanUrlFn?: (url: string) => string;
}

export function ImageGallery({
  images,
  displayMode,
  altName,
  fallbackIcon,
  fallbackText,
  cleanUrlFn = (u) => u,
}: ImageGalleryProps) {
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  // Auto-rotate for carousel
  useEffect(() => {
    if (displayMode !== "carousel" || images.length <= 1) return;
    const interval = setInterval(() => {
      setActiveImgIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [displayMode, images.length]);

  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImgIndex((prev) => (prev + 1) % images.length);
  };

  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImgIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (images.length === 0) {
    return (
      <div className="flex size-full flex-col items-center justify-center bg-zinc-900/40 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-800">
        {fallbackIcon}
        <span className="mt-3 text-[9px] font-semibold tracking-[0.2em] uppercase opacity-40">
          {fallbackText}
        </span>
      </div>
    );
  }

  if (displayMode === "collage") {
    return (
      <div className="flex size-full">
        {images.map((imgUrl: string, idx: number) => (
          <div
            key={imgUrl}
            className="relative h-full overflow-hidden"
            // eslint-disable-next-line react/forbid-dom-props
            style={{ width: `${100 / images.length}%` }}
          >
            <Image
              src={cleanUrlFn(imgUrl)}
              alt={`${altName} - ${idx + 1}`}
              fill
              priority={true}
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-contain p-4 transition-transform duration-700 group-hover:scale-110 hover:scale-110"
            />
            {idx > 0 && (
              <div className="absolute inset-y-0 left-0 z-10 w-px bg-white/20 dark:bg-white/30" />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <Image
        src={cleanUrlFn(images[activeImgIndex])}
        alt={`${altName} - ${activeImgIndex + 1}`}
        sizes="(max-width: 768px) 100vw, 33vw"
        priority={true}
        className="object-contain p-4 transition-transform duration-700 group-hover:scale-110 hover:scale-110"
        fill
      />
      {images.length > 1 && (
        <>
          <button
            onClick={prevImg}
            className="absolute top-1/2 left-3 flex size-7 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/80 text-white opacity-0 shadow-xs backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100 hover:bg-zinc-800"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={nextImg}
            className="absolute top-1/2 right-3 flex size-7 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/80 text-white opacity-0 shadow-xs backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100 hover:bg-zinc-800"
          >
            <ChevronRight size={16} />
          </button>
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {images.map((_: string, i: number) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeImgIndex === i ? "w-4 bg-white" : "w-1.5 bg-white/40"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
