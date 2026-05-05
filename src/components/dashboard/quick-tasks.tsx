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
    <BentoCard className="p-6 h-full flex flex-col">
      <h3 className="font-bold mb-4 flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />{" "}
        {t("dash.quick_tasks")}
      </h3>

      <div className="flex gap-2 mb-6">
        <Input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder={t("dash.add_task")}
          className="rounded-xl border-slate-100 bg-slate-50 focus-visible:ring-blue-500"
          onKeyDown={(e) => e.key === "Enter" && addTask()}
        />
        <Button
          onClick={addTask}
          size="icon"
          className="rounded-xl bg-slate-900 text-white shrink-0"
        >
          <Plus size={18} />
        </Button>
      </div>

      <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 group animate-in slide-in-from-left duration-300"
          >
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => toggleTask(task.id)}
              className="rounded-md border-slate-200 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
            />
            <span
              className={`text-sm flex-1 ${task.completed ? "text-slate-400 line-through" : "text-slate-700"}`}
            >
              {task.text}
            </span>
            <button
              onClick={() => deleteTask(task.id)}
              className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {tasks.length === 0 && (
          <p className="text-xs text-slate-400 italic text-center py-8">
            Няма текущи задачи.
          </p>
        )}
      </div>
    </BentoCard>
  );
};
