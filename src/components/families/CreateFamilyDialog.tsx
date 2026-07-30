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
  DialogHeader,
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
        <BentoCard className="group flex cursor-pointer flex-col items-center justify-center space-y-4 rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/50 p-6 shadow-none transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="rounded-full bg-white p-4 shadow-sm transition-transform group-hover:scale-110 dark:bg-zinc-800">
            <PlusCircle className="size-6 text-zinc-400" />
          </div>
          <p className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
            Ново семейство
          </p>
        </BentoCard>
      </DialogTrigger>
      <DialogContent className="rounded-4xl border-none shadow-2xl sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light tracking-tight">
            Ново семейство
          </DialogTitle>
          <DialogDescription className="font-medium text-zinc-500">
            Въведете име за новото семейство (напр. &quot;Семейство
            Иванови&quot;).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-6 pt-4">
          <div className="space-y-2">
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
              className="h-12 rounded-2xl border-zinc-100 bg-zinc-50/50 transition-all focus:bg-white"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !name.trim()}
            className="h-12 w-full rounded-2xl bg-zinc-950 text-xs font-bold tracking-widest text-white uppercase transition-all hover:bg-zinc-900"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Създаване"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
