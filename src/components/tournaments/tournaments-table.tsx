"use client";

import { Tournament } from "@/types/tournament.types";
import { columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface TournamentsTableProps {
  tournaments: Tournament[];
}

export function TournamentsTable({ tournaments }: TournamentsTableProps) {
  const router = useRouter();

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => router.push('/tournaments/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Създай нов турнир
        </Button>
      </div>
      <DataTable columns={columns} data={tournaments} />
    </div>
  );
}
