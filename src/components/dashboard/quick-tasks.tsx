/* eslint-disable sonarjs/no-nested-conditional */
/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/context/language-context";

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export const QuickTasks = () => {
  const { t } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("dash_tasks");
    if (saved) {
      setTimeout(() => setTasks(JSON.parse(saved)), 0);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("dash_tasks", JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks([
      { id: Date.now().toString(), text: newTask, completed: false },
      ...tasks,
    ]);
    setNewTask("");
  };

  const toggleTask = (id: string) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  return (
    <BentoCard className="p-8 h-full flex flex-col border border-zinc-100 bg-white shadow-none rounded-4xl">
      <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-6 flex items-center gap-3">
        <CheckCircle2 className="h-4 w-4 text-emerald-500" strokeWidth={1.5} />{" "}
        {t("dash.quick_tasks")}
      </h2>

      <div className="flex gap-2 mb-8">
        <Input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder={t("dash.add_task")}
          className="h-12 rounded-xl border-zinc-100 bg-zinc-50 focus-visible:ring-zinc-200 text-sm placeholder:text-zinc-400"
          onKeyDown={(e) => e.key === "Enter" && addTask()}
        />
        <Button
          onClick={addTask}
          size="icon"
          aria-label={t("dash.add_task") || "Добави задача"}
          className="h-12 w-12 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 shrink-0 shadow-none transition-all"
        >
          <Plus size={18} strokeWidth={1.5} />
        </Button>
      </div>

      <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-4 group animate-in slide-in-from-left duration-300"
          >
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => toggleTask(task.id)}
              className="h-5 w-5 rounded-md border-zinc-200 data-[state=checked]:bg-zinc-950 data-[state=checked]:border-zinc-950 transition-all"
            />
            <span
              className={`text-sm flex-1 font-light transition-all ${task.completed ? "text-zinc-300 line-through" : "text-zinc-650"}`}
            >
              {task.text}
            </span>
            <button
              onClick={() => deleteTask(task.id)}
              aria-label="Изтрий задача"
              className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-rose-500 transition-all"
            >
              <Trash2 size={14} strokeWidth={1.5} />
            </button>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 size={32} strokeWidth={1} className="text-zinc-300" />
            <p className="text-[10px] uppercase tracking-widest mt-4 font-semibold text-zinc-700 dark:text-zinc-400">
              Всичко е изпълнено
            </p>
          </div>
        )}
      </div>
    </BentoCard>
  );
};
