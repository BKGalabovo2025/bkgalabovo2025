"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Save } from "lucide-react";

interface ShadowReportFormProps {
  rpeScore: number;
  setRpeScore: (score: number) => void;
  rpeNotes: string;
  setRpeNotes: (notes: string) => void;
  onSave: () => void;
}

export function ShadowReportForm({
  rpeScore,
  setRpeScore,
  rpeNotes,
  setRpeNotes,
  onSave,
}: ShadowReportFormProps) {
  return (
    <div className="w-full max-w-2xl mx-auto animate-in slide-in-from-bottom-8 duration-500">
      <Card className="border-none shadow-2xl bg-zinc-950 overflow-hidden text-white relative p-8">
        <div className="flex flex-col items-center justify-center space-y-6">
          <CheckCircle2 size={72} className="text-green-500" />
          <h2 className="text-3xl font-black tracking-tight text-center">
            Тренировъчен Отчет
          </h2>
          <p className="text-zinc-400 text-center max-w-md text-lg">
            Оценете натоварването на групата (RPE) и добавете бележки за сесията.
          </p>

          <div className="w-full bg-zinc-900 rounded-2xl p-8 border border-zinc-800 space-y-8 mt-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-xl font-bold">Оценка на умората (RPE)</Label>
                <span className="text-3xl font-black text-primary">{rpeScore}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={rpeScore}
                onChange={(e) => setRpeScore(parseInt(e.target.value))}
                className="w-full h-4 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-sm text-zinc-500 font-medium">
                <span>Леко (1)</span>
                <span>Умерено (5)</span>
                <span>Максимум (10)</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xl font-bold">Бързи бележки</Label>
              <Textarea
                placeholder="Напр. Проблеми със сплит степа при задна линия..."
                className="bg-zinc-950 border-zinc-800 text-lg p-4 min-h-[120px]"
                value={rpeNotes}
                onChange={(e) => setRpeNotes(e.target.value)}
              />
            </div>
          </div>

          <Button
            size="lg"
            onClick={onSave}
            className="w-full h-16 text-xl bg-green-600 hover:bg-green-700 text-white font-black mt-8 rounded-xl"
          >
            <Save className="mr-3 h-6 w-6" /> ЗАПИШИ В КЛУБНАТА БАЗА ДАННИ
          </Button>
        </div>
      </Card>
    </div>
  );
}
