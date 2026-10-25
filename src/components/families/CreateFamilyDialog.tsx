"use client";

import { Loader2, PlusCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { createFamilyAction } from "@/lib/actions/families";

export const CreateFamilyDialog = () => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    setLoading(true);
    try {
      const idToken = await user.getIdToken();
      const result = await createFamilyAction(name.trim(), idToken);
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        setName("");
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Възникна грешка при създаване.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <BentoCard className="group flex cursor-pointer flex-col items-center justify-center space-y-2.5 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-4 sm:p-5 shadow-none transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="rounded-full bg-white p-2.5 sm:p-3 shadow-sm transition-transform group-hover:scale-110 dark:bg-zinc-800">
            <PlusCircle className="size-5 text-zinc-400" />
          </div>
          <p className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
            Ново семейство
          </p>
        </BentoCard>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90dvh] sm:max-h-[85vh] w-[calc(100%-1.25rem)] sm:w-full sm:max-w-md flex-col gap-0 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-0 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 [&>button:last-child]:top-3.5 [&>button:last-child]:right-3.5">
        {/* Fixed Sticky Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-4 py-3 sm:px-5 sm:py-3.5 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="flex items-center gap-3 pr-8">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
              <PlusCircle className="size-4" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate text-base font-bold text-zinc-900 sm:text-lg dark:text-white">
                Ново семейство
              </DialogTitle>
              <DialogDescription className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                Въведете име (напр. &quot;Семейство Иванови&quot;)
              </DialogDescription>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleCreate}
          className="flex flex-1 flex-col overflow-hidden min-h-0"
        >
          <div className="custom-scrollbar flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-4.5 space-y-3 min-h-0">
            <div className="space-y-1.5">
              <Label
                htmlFor="name"
                className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase"
              >
                Име на семейството
              </Label>
              <Input
                id="name"
                placeholder="Име..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 rounded-xl border-zinc-200 bg-zinc-50/50 text-xs font-medium transition-all focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50"
                required
              />
            </div>
          </div>

          {/* Fixed Sticky Footer */}
          <div className="shrink-0 flex items-center justify-end gap-2 border-t border-zinc-100 bg-zinc-50/80 px-4 py-2.5 sm:px-5 sm:py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
            <Button
              type="button"
              variant="ghost"
              className="h-9 rounded-xl px-4 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              onClick={() => setOpen(false)}
            >
              Отказ
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="h-9 rounded-xl bg-zinc-950 px-5 text-xs font-bold text-white shadow-sm transition-all hover:bg-zinc-900 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              {loading ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : null}
              Създаване
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
