"use client";

import { Activity } from "lucide-react";
import React, { useState } from "react";

import { BentoCard } from "@/components/ui/bento-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  calculateVO2Max,
  evaluateBadmintonScore,
  getTotalShuttles,
} from "@/lib/beep-test-norms";

const NORMS_TABLE = [
  {
    group: "U9 / U11",
    male: {
      poor: "< 6",
      average: "6 - 7",
      good: "7 - 8",
      excellent: "8 - 9",
      elite: "≥ 9",
    },
    female: {
      poor: "< 5",
      average: "5 - 6",
      good: "6 - 7",
      excellent: "7 - 8",
      elite: "≥ 8",
    },
  },
  {
    group: "U13",
    male: {
      poor: "< 7",
      average: "7 - 8",
      good: "8 - 9",
      excellent: "9 - 10",
      elite: "≥ 10",
    },
    female: {
      poor: "< 6",
      average: "6 - 7",
      good: "7 - 8",
      excellent: "8 - 9",
      elite: "≥ 9",
    },
  },
  {
    group: "U15",
    male: {
      poor: "< 8",
      average: "8 - 9",
      good: "9 - 10",
      excellent: "10 - 12",
      elite: "≥ 12",
    },
    female: {
      poor: "< 7",
      average: "7 - 8",
      good: "8 - 9",
      excellent: "9 - 10",
      elite: "≥ 10",
    },
  },
  {
    group: "U17 / U19 / Мъже / Жени",
    male: {
      poor: "< 9",
      average: "9 - 10",
      good: "10 - 12",
      excellent: "12 - 13",
      elite: "≥ 13",
    },
    female: {
      poor: "< 8",
      average: "8 - 9",
      good: "9 - 10",
      excellent: "10 - 11",
      elite: "≥ 11",
    },
  },
];

export function BeepTestNormsView() {
  const [calcLevel, setCalcLevel] = useState(8);
  const [calcShuttle, setCalcShuttle] = useState(4);
  const [calcAgeGroup, setCalcAgeGroup] = useState("U15");
  const [calcGender, setCalcGender] = useState<"male" | "female">("male");

  const totalShuttles = getTotalShuttles(calcLevel, calcShuttle);
  const vo2 = calculateVO2Max(totalShuttles);
  const score = evaluateBadmintonScore(calcLevel, calcAgeGroup, calcGender);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 cols: Norms Tables */}
        <div className="space-y-6 lg:col-span-2">
          <BentoCard className="border-zinc-200/80 bg-white/90 p-5 dark:border-zinc-800/80 dark:bg-zinc-900/90">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Нормативи за Бадминтон (20m Multi-Stage Fitness Test)
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Официални прагове за нива по възрастови групи и пол съгласно
                методиката на BWF
              </p>
            </div>
            <div className="mt-4 space-y-6">
              <div>
                <div className="flex items-center gap-2 pb-2 text-sm font-bold text-blue-600 dark:text-blue-400">
                  <Activity className="size-4" />
                  <span>Мъже / Момчета (Ниво на отпадане)</span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      <tr>
                        <th className="p-2.5 font-bold">Възраст</th>
                        <th className="p-2.5 text-red-600 dark:text-red-400">
                          Лош
                        </th>
                        <th className="p-2.5 text-amber-600 dark:text-amber-400">
                          Среден
                        </th>
                        <th className="p-2.5 text-blue-600 dark:text-blue-400">
                          Добър
                        </th>
                        <th className="p-2.5 text-emerald-600 dark:text-emerald-400">
                          Отличен
                        </th>
                        <th className="p-2.5 text-purple-600 dark:text-purple-400">
                          Елитен
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {NORMS_TABLE.map((row) => (
                        <tr
                          key={row.group}
                          className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        >
                          <td className="p-2.5 font-bold text-zinc-900 dark:text-zinc-100">
                            {row.group}
                          </td>
                          <td className="p-2.5 font-medium">{row.male.poor}</td>
                          <td className="p-2.5 font-medium">
                            {row.male.average}
                          </td>
                          <td className="p-2.5 font-medium">{row.male.good}</td>
                          <td className="p-2.5 font-medium">
                            {row.male.excellent}
                          </td>
                          <td className="p-2.5 font-bold text-purple-600 dark:text-purple-400">
                            {row.male.elite}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 pb-2 text-sm font-bold text-pink-600 dark:text-pink-400">
                  <Activity className="size-4" />
                  <span>Жени / Момичета (Ниво на отпадане)</span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      <tr>
                        <th className="p-2.5 font-bold">Възраст</th>
                        <th className="p-2.5 text-red-600 dark:text-red-400">
                          Лош
                        </th>
                        <th className="p-2.5 text-amber-600 dark:text-amber-400">
                          Среден
                        </th>
                        <th className="p-2.5 text-blue-600 dark:text-blue-400">
                          Добър
                        </th>
                        <th className="p-2.5 text-emerald-600 dark:text-emerald-400">
                          Отличен
                        </th>
                        <th className="p-2.5 text-purple-600 dark:text-purple-400">
                          Елитен
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {NORMS_TABLE.map((row) => (
                        <tr
                          key={row.group}
                          className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        >
                          <td className="p-2.5 font-bold text-zinc-900 dark:text-zinc-100">
                            {row.group}
                          </td>
                          <td className="p-2.5 font-medium">
                            {row.female.poor}
                          </td>
                          <td className="p-2.5 font-medium">
                            {row.female.average}
                          </td>
                          <td className="p-2.5 font-medium">
                            {row.female.good}
                          </td>
                          <td className="p-2.5 font-medium">
                            {row.female.excellent}
                          </td>
                          <td className="p-2.5 font-bold text-purple-600 dark:text-purple-400">
                            {row.female.elite}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </BentoCard>
        </div>

        {/* Right 1 col: Calculator */}
        <div>
          <BentoCard className="border-zinc-200/80 bg-white/90 p-5 dark:border-zinc-800/80 dark:bg-zinc-900/90">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Калкулатор за VO2 Max & Оценка
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Симулирай резултат и пресметни аеробния капацитет
              </p>
            </div>
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Ниво (Level)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={21}
                    value={calcLevel}
                    onChange={(e) => setCalcLevel(Number(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Совалка (Shuttle)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={16}
                    value={calcShuttle}
                    onChange={(e) =>
                      setCalcShuttle(Number(e.target.value) || 1)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Възрастова група</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-hidden"
                    value={calcAgeGroup}
                    onChange={(e) => setCalcAgeGroup(e.target.value)}
                  >
                    <option value="U9">U9</option>
                    <option value="U11">U11</option>
                    <option value="U13">U13</option>
                    <option value="U15">U15</option>
                    <option value="U17">U17</option>
                    <option value="U19">U19</option>
                    <option value="Adults">Мъже/Жени</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Пол</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-hidden"
                    value={calcGender}
                    onChange={(e) =>
                      setCalcGender(e.target.value as "male" | "female")
                    }
                  >
                    <option value="male">Мъж / Момче</option>
                    <option value="female">Жена / Момиче</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-zinc-200/80 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-700">
                  <span className="text-xs text-zinc-500">
                    Общо избягани совалки:
                  </span>
                  <span className="text-base font-black text-zinc-900 dark:text-zinc-100">
                    {totalShuttles}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-zinc-200 py-3 dark:border-zinc-700">
                  <span className="text-xs text-zinc-500">
                    VO2 Max (ml/kg/min):
                  </span>
                  <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                    {vo2}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3">
                  <span className="text-xs text-zinc-500">
                    Оценка за бадминтон:
                  </span>
                  <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {score}
                  </span>
                </div>
              </div>
            </div>
          </BentoCard>
        </div>
      </div>
    </div>
  );
}
