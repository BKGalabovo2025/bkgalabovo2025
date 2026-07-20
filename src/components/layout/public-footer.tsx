import { Trophy } from "lucide-react";
import { Site } from "@/types/site.types";

export function PublicFooter({
  clubSite: _clubSite,
}: {
  clubSite?: Site | null;
}) {
  return (
    <footer className="flex flex-col items-center justify-between gap-4 border-t border-zinc-900 bg-black p-8 md:flex-row">
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-xl bg-blue-400">
          <Trophy size={14} className="text-white" />
        </div>
        <span className="text-sm font-bold text-zinc-400 uppercase">
          СНЦ „Бадминтон Клуб Гълъбово“
        </span>
      </div>
      <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
        © {new Date().getFullYear()} Всички права запазени
      </span>
    </footer>
  );
}
