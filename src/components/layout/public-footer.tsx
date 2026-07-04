import { Trophy } from "lucide-react";
import { Site } from "@/types/site.types";

export function PublicFooter({
  clubSite: _clubSite,
}: {
  clubSite?: Site | null;
}) {
  return (
    <footer className="px-8 py-8 border-t border-zinc-900 bg-black flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 bg-blue-400 rounded-xl flex items-center justify-center">
          <Trophy size={14} className="text-white" />
        </div>
        <span className="text-sm font-bold text-zinc-400 uppercase">
          СНЦ „Бадминтон Клуб Гълъбово“
        </span>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
        © {new Date().getFullYear()} Всички права запазени
      </span>
    </footer>
  );
}
