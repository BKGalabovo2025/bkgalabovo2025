import InventoryClient from "./InventoryClient";

export const dynamic = "force-dynamic";

export default function InventoryPage() {
  return (
    <div className="pb-12">
      <InventoryClient />
    </div>
  );
}
