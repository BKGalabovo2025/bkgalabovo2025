 
 
 
"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { createFamilyAction } from "@/lib/actions/families";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Loader2 } from "lucide-react";
import { BentoCard } from "@/components/ui/bento-card";

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
        <BentoCard className="p-6 flex flex-col items-center justify-center space-y-4 border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-3xl shadow-none cursor-pointer hover:border-zinc-300 transition-all group">
          <div className="p-4 bg-white dark:bg-zinc-800 rounded-full shadow-sm group-hover:scale-110 transition-transform">
            <PlusCircle className="h-6 w-6 text-zinc-400" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Ново семейство
          </p>
        </BentoCard>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-4xl border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light tracking-tight">
            Ново семейство
          </DialogTitle>
          <DialogDescription className="text-zinc-500 font-medium">
            Въведете име за новото семейство (напр. &quot;Семейство
            Иванови&quot;).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-[10px] uppercase tracking-widest font-bold text-zinc-400"
            >
              Име на семейството
            </Label>
            <Input
              id="name"
              placeholder="Име..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-2xl border-zinc-100 bg-zinc-50/50 focus:bg-white transition-all"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full h-12 rounded-2xl bg-zinc-950 text-white hover:bg-zinc-900 transition-all text-xs uppercase tracking-widest font-bold"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Създаване"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
