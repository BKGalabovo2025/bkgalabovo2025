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
          <Button className="rounded-xl font-medium text-[11px] uppercase tracking-[0.2em] bg-zinc-950 text-white hover:bg-zinc-800 shadow-none h-12 px-8 transition-all">
            <Share2 className="mr-3 h-4 w-4" strokeWidth={1.5} /> Сподели Топ 3
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md bg-white border border-zinc-100 text-zinc-950 rounded-5xl overflow-hidden shadow-2xl">
          <DialogHeader className="pt-8 px-8">
            <DialogTitle className="text-[11px] font-medium uppercase tracking-[0.3em] text-zinc-400 text-center">
              Генериране на Story
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-8 py-8 px-8">
            {/* Preview of the Story (scaled down) */}
            <div className="relative w-[240px] h-[426px] shadow-2xl rounded-2xl overflow-hidden ring-1 ring-zinc-100 scale-90 sm:scale-100 origin-center">
              <StoryContent ref={storyRef} topThree={topThree} />
            </div>

            <Button
              onClick={handleDownload}
              disabled={isGenerating}
              className="w-full h-14 rounded-2xl bg-zinc-950 text-white hover:bg-zinc-800 font-medium uppercase tracking-widest text-[11px] shadow-none transition-all"
            >
              {isGenerating ? (
                <Loader2 className="mr-3 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-3 h-4 w-4" strokeWidth={1.5} />
              )}
              {isGenerating ? "Генериране..." : "Изтегли за Instagram"}
            </Button>

            <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-[0.2em] text-center leading-relaxed">
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
        style={{ width: "1080px", height: "1920px" }}
        className="bg-white flex flex-col items-center justify-between p-24 relative overflow-hidden"
      >
        {/* Background Decorative Elements - Subtle and Airy */}
        <div className="absolute top-0 right-0 w-[1200px] h-[1200px] bg-zinc-50 rounded-full -mr-600 -mt-600" />
        <div className="absolute bottom-0 left-0 w-[1200px] h-[1200px] bg-zinc-50/50 rounded-full -ml-600 -mb-600" />

        {/* Header */}
        <div className="relative z-10 text-center mt-32">
          <div className="w-48 h-48 bg-zinc-950 rounded-[64px] flex items-center justify-center mx-auto mb-16 shadow-2xl">
            <Trophy size={80} className="text-white" strokeWidth={1} />
          </div>
          <h1 className="text-7xl font-light text-zinc-900 uppercase tracking-[0.4em] mb-6">
            BADMINTON CLUB
          </h1>
          <p className="text-3xl font-medium text-zinc-400 uppercase tracking-[0.6em]">
            TOP 3 RANKINGS
          </p>
        </div>

        {/* Podium - Airy Minimalist Version */}
        <div className="relative z-10 w-full flex items-end justify-center gap-12 mb-32 px-12">
          {/* 2nd Place */}
          {topThree[1] && (
            <div className="flex flex-col items-center w-full max-w-[300px]">
              <div className="text-7xl mb-10 opacity-80">🥈</div>
              <div className="w-full bg-white border border-zinc-100 rounded-[60px] p-16 text-center shadow-xl">
                <p className="text-4xl font-light text-zinc-900 truncate mb-6">
                  {topThree[1].memberName}
                </p>
                <p className="text-7xl font-medium text-zinc-300 tracking-tighter">
                  {topThree[1].totalPoints}
                </p>
                <p className="text-xl font-medium uppercase tracking-[0.4em] text-zinc-400 mt-4">
                  PTS
                </p>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {topThree[0] && (
            <div className="flex flex-col items-center w-full max-w-[400px] mb-24">
              <div className="text-[140px] mb-12">🥇</div>
              <div className="w-full bg-zinc-950 rounded-[80px] p-24 text-center shadow-2xl relative">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-zinc-950 border border-zinc-100 px-12 py-4 rounded-full font-medium text-2xl uppercase tracking-[0.3em] shadow-xl">
                  WINNER
                </div>
                <p className="text-5xl font-light text-white truncate mb-8 mt-4">
                  {topThree[0].memberName}
                </p>
                <p className="text-9xl font-medium text-white tracking-tighter">
                  {topThree[0].totalPoints}
                </p>
                <p className="text-2xl font-medium uppercase tracking-[0.5em] text-zinc-500 mt-6">
                  POINTS
                </p>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {topThree[2] && (
            <div className="flex flex-col items-center w-full max-w-[300px]">
              <div className="text-7xl mb-10 opacity-80">🥉</div>
              <div className="w-full bg-white border border-zinc-100 rounded-[60px] p-16 text-center shadow-xl">
                <p className="text-4xl font-light text-zinc-900 truncate mb-6">
                  {topThree[2].memberName}
                </p>
                <p className="text-7xl font-medium text-amber-600/60 tracking-tighter">
                  {topThree[2].totalPoints}
                </p>
                <p className="text-xl font-medium uppercase tracking-[0.4em] text-zinc-400 mt-4">
                  PTS
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="relative z-10 text-center mb-32">
          <p className="text-2xl font-medium text-zinc-200 uppercase tracking-[0.8em] mb-8">
            WWW.BKGALABOVO.BG
          </p>
          <div className="h-1 w-48 bg-zinc-100 mx-auto rounded-full" />
        </div>
      </div>
    );
  }
);

StoryContent.displayName = "StoryContent";
