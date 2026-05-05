"use client";

import React from "react";
import { useMembers } from "@/hooks/useMembers";
import { columns } from "@/components/members/columns";
import { DataTable } from "@/components/ui/data-table";

const MembersPage = () => {
  const { members, loading, error } = useMembers();

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Members</h1>
      <DataTable columns={columns} data={members} />
    </div>
  );
};

export default MembersPage;
