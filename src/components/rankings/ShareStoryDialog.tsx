"use client";

import { useState, useRef } from "react";
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
          <Button className="rounded-xl font-black text-xs uppercase tracking-widest bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-900/20">
            <Share2 className="mr-2 h-4 w-4" /> Сподели Топ 3
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-white rounded-[32px] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-black font-bento uppercase tracking-tight text-center">
              Генериране на Story
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-6 py-4">
            {/* Preview of the Story (scaled down) */}
            <div className="relative w-[240px] h-[426px] shadow-2xl rounded-2xl overflow-hidden ring-1 ring-white/10 scale-90 sm:scale-100 origin-center">
              <StoryContent ref={storyRef} topThree={topThree} />
            </div>

            <Button
              onClick={handleDownload}
              disabled={isGenerating}
              className="w-full h-12 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-black uppercase tracking-widest text-xs"
            >
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {isGenerating ? "Генериране..." : "Изтегли за Instagram"}
            </Button>

            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] text-center">
              Изображението ще бъде изтеглено с високо качество (1080x1920)
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

import React, { forwardRef } from "react";

const StoryContent = forwardRef<HTMLDivElement, { topThree: RankingEntry[] }>(
  ({ topThree }, ref) => {
    return (
      <div
        ref={ref}
        style={{ width: "1080px", height: "1920px" }}
        className="bg-slate-950 flex flex-col items-center justify-between p-20 relative overflow-hidden"
      >
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-blue-600/20 rounded-full blur-[200px] -mr-500 -mt-500" />
        <div className="absolute bottom-0 left-0 w-[1000px] h-[1000px] bg-purple-600/20 rounded-full blur-[200px] -ml-500 -mb-500" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full" />

        {/* Header */}
        <div className="relative z-10 text-center mt-20">
          <div className="w-40 h-40 bg-blue-600 rounded-[48px] flex items-center justify-center mx-auto mb-12 shadow-2xl shadow-blue-500/20 rotate-12">
            <Trophy size={80} className="text-white" />
          </div>
          <h1 className="text-8xl font-black text-white uppercase tracking-tighter mb-4 leading-[0.8]">
            BK GALABOVO
          </h1>
          <p className="text-3xl font-black text-blue-400 uppercase tracking-[0.4em]">
            OFFICIAL RANKINGS
          </p>
        </div>

        {/* Podium */}
        <div className="relative z-10 w-full flex items-end justify-center gap-10 mb-20">
          {/* 2nd Place */}
          {topThree[1] && (
            <div className="flex flex-col items-center w-80">
              <div className="text-8xl mb-8">🥈</div>
              <div className="w-full bg-slate-900/80 backdrop-blur-xl rounded-[40px] p-12 text-center border-t-8 border-slate-400 shadow-2xl">
                <p className="text-3xl font-black text-white truncate mb-4">
                  {topThree[1].memberName}
                </p>
                <p className="text-6xl font-black text-slate-300">
                  {topThree[1].totalPoints}
                </p>
                <p className="text-xl font-bold uppercase tracking-widest text-slate-500 mt-2">
                  POINTS
                </p>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {topThree[0] && (
            <div className="flex flex-col items-center w-[400px] mb-20">
              <div className="text-[120px] mb-8">🥇</div>
              <div className="w-full bg-blue-600 rounded-[50px] p-16 text-center shadow-[0_0_100px_rgba(37,99,235,0.4)] relative border-t-8 border-yellow-400">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-900 px-8 py-3 rounded-2xl font-black text-2xl uppercase tracking-widest">
                  CHAMPION
                </div>
                <p className="text-4xl font-black text-white truncate mb-6 mt-4">
                  {topThree[0].memberName}
                </p>
                <p className="text-8xl font-black text-white">
                  {topThree[0].totalPoints}
                </p>
                <p className="text-2xl font-bold uppercase tracking-widest text-blue-200 mt-2">
                  POINTS
                </p>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {topThree[2] && (
            <div className="flex flex-col items-center w-80">
              <div className="text-8xl mb-8">🥉</div>
              <div className="w-full bg-slate-900/80 backdrop-blur-xl rounded-[40px] p-12 text-center border-t-8 border-orange-400 shadow-2xl">
                <p className="text-3xl font-black text-white truncate mb-4">
                  {topThree[2].memberName}
                </p>
                <p className="text-6xl font-black text-orange-400">
                  {topThree[2].totalPoints}
                </p>
                <p className="text-xl font-bold uppercase tracking-widest text-slate-500 mt-2">
                  POINTS
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="relative z-10 text-center mb-20">
          <p className="text-3xl font-black text-white/40 uppercase tracking-[0.5em] mb-4">
            WWW.BKGALABOVO.BG
          </p>
          <div className="h-1 w-40 bg-blue-600 mx-auto rounded-full" />
        </div>
      </div>
    );
  }
);

StoryContent.displayName = "StoryContent";
