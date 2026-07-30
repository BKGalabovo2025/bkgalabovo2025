"use client";

import { collection, getDocs, query, where } from "firebase/firestore";
import { Eye, FileText, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getDb } from "@/lib/firebase";

interface ViewDeclarationButtonProps {
  reservationId: string;
}

export function ViewDeclarationButton({
  reservationId,
}: ViewDeclarationButtonProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [declarations, setDeclarations] = useState<
    { id: string; memberName: string }[]
  >([]);

  const handleFetch = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(getDb(), "member_declarations"),
        where("reservationId", "==", reservationId)
      );
      const snap = await getDocs(q);
      const docs = snap.docs.map((d) => ({
        id: d.id,
        memberName: d.data().memberName || "Клиент",
      }));

      if (docs.length === 0) {
        toast.error("Няма намерени декларации за тази резервация.");
      } else if (docs.length === 1) {
        window.open(`/print-declaration/${docs[0].id}`, "_blank");
      } else {
        setDeclarations(docs);
        setOpen(true);
      }
    } catch (err) {
      console.error("Грешка при зареждане:", err);
      toast.error("Грешка при зареждане на декларацията");
    } finally {
      setLoading(false);
    }
  };

  if (open && declarations.length > 1) {
    return (
      <div onClick={(e) => e.stopPropagation()}>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg text-zinc-900 transition-all hover:bg-zinc-100 dark:text-white dark:hover:bg-zinc-800"
              title="Виж декларация"
            >
              <Eye className="size-4 text-emerald-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="rounded-xl border-zinc-100 p-2 shadow-xl"
          >
            <div className="mb-1 px-3 py-2 text-xs font-bold tracking-widest text-zinc-400 uppercase">
              Избери декларация
            </div>
            {declarations.map((d) => (
              <DropdownMenuItem
                key={d.id}
                onClick={() => {
                  window.open(`/print-declaration/${d.id}`, "_blank");
                  setOpen(false);
                }}
                className="cursor-pointer p-3 text-sm font-medium"
              >
                <FileText className="mr-2 size-4 text-zinc-400" />
                {d.memberName}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 rounded-lg text-zinc-900 transition-all hover:bg-zinc-100 dark:text-white dark:hover:bg-zinc-800"
      title="Виж декларация"
      onClick={(e) => {
        e.stopPropagation();
        handleFetch();
      }}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin text-emerald-500" />
      ) : (
        <Eye className="size-4 text-emerald-500" />
      )}
    </Button>
  );
}
