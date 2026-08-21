import InventoryClient from "./inventory-client";

export default function InventoryPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">
            Инвентар и Оборудване
          </h1>
          <p className="text-sm text-zinc-500">
            Управлявайте клубното оборудване и задавайте правила за разпределение по станции.
          </p>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-zinc-50 p-6">
        <InventoryClient />
      </div>
    </div>
  );
}
