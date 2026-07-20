 
 
 
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
    <BentoCard className="flex h-full flex-col rounded-4xl border border-zinc-100 bg-white p-8 shadow-none">
      <h2 className="mb-6 flex items-center gap-3 text-[11px] font-medium tracking-[0.2em] text-zinc-500 uppercase dark:text-zinc-400">
        <CheckCircle2 className="size-4 text-emerald-500" strokeWidth={1.5} />{" "}
        {t("dash.quick_tasks")}
      </h2>

      <div className="mb-8 flex gap-2">
        <Input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder={t("dash.add_task")}
          className="h-12 rounded-xl border-zinc-100 bg-zinc-50 text-sm placeholder:text-zinc-400 focus-visible:ring-zinc-200"
          onKeyDown={(e) => e.key === "Enter" && addTask()}
        />
        <Button
          onClick={addTask}
          size="icon"
          aria-label={t("dash.add_task") || "Добави задача"}
          className="size-12 shrink-0 rounded-xl bg-zinc-950 text-white shadow-none transition-all hover:bg-zinc-800"
        >
          <Plus size={18} strokeWidth={1.5} />
        </Button>
      </div>

      <div className="custom-scrollbar max-h-100 space-y-4 overflow-y-auto pr-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="group flex items-center gap-4 duration-300 animate-in slide-in-from-left"
          >
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => toggleTask(task.id)}
              className="size-5 rounded-md border-zinc-200 transition-all data-[state=checked]:border-zinc-950 data-[state=checked]:bg-zinc-950"
            />
            <span
              className={`flex-1 text-sm font-light transition-all ${task.completed ? "text-zinc-300 line-through" : "text-zinc-650"}`}
            >
              {task.text}
            </span>
            <button
              onClick={() => deleteTask(task.id)}
              aria-label="Изтрий задача"
              className="text-zinc-400 opacity-0 transition-all group-hover:opacity-100 hover:text-rose-500"
            >
              <Trash2 size={14} strokeWidth={1.5} />
            </button>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 size={32} strokeWidth={1} className="text-zinc-300" />
            <p className="mt-4 text-[10px] font-semibold tracking-widest text-zinc-700 uppercase dark:text-zinc-400">
              Всичко е изпълнено
            </p>
          </div>
        )}
      </div>
    </BentoCard>
  );
};
