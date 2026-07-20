"use client";

import { useState, useRef, forwardRef } from "react";
import { RankingEntry } from "@/types/ranking.types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Download, Loader2, Trophy } from "lucide-react";
import { toast } from "sonner";
import Script from "next/script";

interface ShareStoryDialogProps {
  topThree: RankingEntry[];
}

export default function ShareStoryDialog({ topThree }: ShareStoryDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const storyRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!storyRef.current || !window.html2canvas) {
      toast.error("Библиотеката за изображения се зарежда. Моля, изчакайте.");
      return;
    }

    try {
      setIsGenerating(true);
      const canvas = await window.html2canvas(storyRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });

      const link = document.createElement("a");
      link.download = `BK-Galabovo-Top3-Rankings.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Изображението е готово за споделяне!");
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Възникна грешка при генерирането.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
        strategy="lazyOnload"
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="h-12 rounded-xl bg-zinc-950 px-8 text-[11px] font-medium tracking-[0.2em] text-white uppercase shadow-none transition-all hover:bg-zinc-800">
            <Share2 className="mr-3 size-4" strokeWidth={1.5} /> Сподели Топ 3
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md overflow-hidden rounded-5xl border border-zinc-100 bg-white text-zinc-950 shadow-2xl">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="text-center text-[11px] font-medium tracking-[0.3em] text-zinc-400 uppercase">
              Генериране на Story
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-8 p-8">
            {/* Preview of the Story (scaled down) */}
            <div className="relative h-[426px] w-60 origin-center scale-90 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-zinc-100 sm:scale-100">
              <StoryContent ref={storyRef} topThree={topThree} />
            </div>

            <Button
              onClick={handleDownload}
              disabled={isGenerating}
              className="h-14 w-full rounded-2xl bg-zinc-950 text-[11px] font-medium tracking-widest text-white uppercase shadow-none transition-all hover:bg-zinc-800"
            >
              {isGenerating ? (
                <Loader2 className="mr-3 size-4 animate-spin" />
              ) : (
                <Download className="mr-3 size-4" strokeWidth={1.5} />
              )}
              {isGenerating ? "Генериране..." : "Изтегли за Instagram"}
            </Button>

            <p className="text-center text-[10px] leading-relaxed font-medium tracking-[0.2em] text-zinc-400 uppercase">
              Изображението ще бъде изтеглено с високо качество (1080x1920)
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

const StoryContent = forwardRef<HTMLDivElement, { topThree: RankingEntry[] }>(
  ({ topThree }, ref) => {
    return (
      <div
        ref={ref}
        className="relative flex h-480 w-270 flex-col items-center justify-between overflow-hidden bg-white p-24"
      >
        {/* Background Decorative Elements - Subtle and Airy */}
        <div className="absolute top-0 right-0 -mt-600 -mr-600 size-[1200px] rounded-full bg-zinc-50" />
        <div className="absolute bottom-0 left-0 -mb-600 -ml-600 size-[1200px] rounded-full bg-zinc-50/50" />

        {/* Header */}
        <div className="relative z-10 mt-32 text-center">
          <div className="mx-auto mb-16 flex size-48 items-center justify-center rounded-[64px] bg-zinc-950 shadow-2xl">
            <Trophy size={80} className="text-white" strokeWidth={1} />
          </div>
          <h1 className="mb-6 text-7xl font-light tracking-[0.4em] text-zinc-900 uppercase">
            BADMINTON CLUB
          </h1>
          <p className="text-3xl font-medium tracking-[0.6em] text-zinc-400 uppercase">
            TOP 3 RANKINGS
          </p>
        </div>

        {/* Podium - Airy Minimalist Version */}
        <div className="relative z-10 mb-32 flex w-full items-end justify-center gap-12 px-12">
          {/* 2nd Place */}
          {topThree[1] && (
            <div className="flex w-full max-w-75 flex-col items-center">
              <div className="mb-10 text-7xl opacity-80">🥈</div>
              <div className="w-full rounded-[60px] border border-zinc-100 bg-white p-16 text-center shadow-xl">
                <p className="mb-6 truncate text-4xl font-light text-zinc-900">
                  {topThree[1].memberName}
                </p>
                <p className="text-7xl font-medium tracking-tighter text-zinc-300">
                  {topThree[1].totalPoints}
                </p>
                <p className="mt-4 text-xl font-medium tracking-[0.4em] text-zinc-400 uppercase">
                  PTS
                </p>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {topThree[0] && (
            <div className="mb-24 flex w-full max-w-100 flex-col items-center">
              <div className="mb-12 text-[140px]">🥇</div>
              <div className="relative w-full rounded-[80px] bg-zinc-950 p-24 text-center shadow-2xl">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 rounded-full border border-zinc-100 bg-white px-12 py-4 text-2xl font-medium tracking-[0.3em] text-zinc-950 uppercase shadow-xl">
                  WINNER
                </div>
                <p className="mt-4 mb-8 truncate text-5xl font-light text-white">
                  {topThree[0].memberName}
                </p>
                <p className="text-9xl font-medium tracking-tighter text-white">
                  {topThree[0].totalPoints}
                </p>
                <p className="mt-6 text-2xl font-medium tracking-[0.5em] text-zinc-500 uppercase">
                  POINTS
                </p>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {topThree[2] && (
            <div className="flex w-full max-w-75 flex-col items-center">
              <div className="mb-10 text-7xl opacity-80">🥉</div>
              <div className="w-full rounded-[60px] border border-zinc-100 bg-white p-16 text-center shadow-xl">
                <p className="mb-6 truncate text-4xl font-light text-zinc-900">
                  {topThree[2].memberName}
                </p>
                <p className="text-7xl font-medium tracking-tighter text-amber-600/60">
                  {topThree[2].totalPoints}
                </p>
                <p className="mt-4 text-xl font-medium tracking-[0.4em] text-zinc-400 uppercase">
                  PTS
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="relative z-10 mb-32 text-center">
          <p className="mb-8 text-2xl font-medium tracking-[0.8em] text-zinc-200 uppercase">
            WWW.BKGALABOVO.BG
          </p>
          <div className="mx-auto h-1 w-48 rounded-full bg-zinc-100" />
        </div>
      </div>
    );
  }
);

StoryContent.displayName = "StoryContent";
