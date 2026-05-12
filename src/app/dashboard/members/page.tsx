"use client";

import { PageHeader } from "@/components/layout/page-header";
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
    <div className="space-y-6">
      <PageHeader
        title="Members"
        description="Manage your club members and their subscription status."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Members" },
        ]}
      />
      <DataTable columns={columns} data={members} />
    </div>
  );
};

export default MembersPage;
