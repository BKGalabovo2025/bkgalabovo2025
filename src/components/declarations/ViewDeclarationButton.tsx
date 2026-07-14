"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Eye } from "lucide-react";
import { getDb } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
              className="h-8 w-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white transition-all"
              title="Виж декларация"
            >
              <Eye className="w-4 h-4 text-emerald-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="rounded-xl border-zinc-100 shadow-xl p-2"
          >
            <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 px-3 py-2 mb-1">
              Избери декларация
            </div>
            {declarations.map((d) => (
              <DropdownMenuItem
                key={d.id}
                onClick={() => {
                  window.open(`/print-declaration/${d.id}`, "_blank");
                  setOpen(false);
                }}
                className="text-sm font-medium cursor-pointer p-3"
              >
                <FileText className="w-4 h-4 mr-2 text-zinc-400" />
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
      className="h-8 w-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white transition-all"
      title="Виж декларация"
      onClick={(e) => {
        e.stopPropagation();
        handleFetch();
      }}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
      ) : (
        <Eye className="w-4 h-4 text-emerald-500" />
      )}
    </Button>
  );
}
