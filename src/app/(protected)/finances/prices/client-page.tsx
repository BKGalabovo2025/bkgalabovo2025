"use client";

import { useState } from "react";

import { DataTable } from "@/components/shared/data-table";
import { Price } from "@/types/index";

import { columns } from "./columns";
import { EditPriceDialog } from "./edit-price-dialog";
import { PriceHistoryDialog } from "./price-history-dialog";

interface PricesClientPageProps {
  initialPrices: Price[];
}

export function PricesClientPage({ initialPrices }: PricesClientPageProps) {
  const [prices, setPrices] = useState<Price[]>(initialPrices);
  const [selectedPrice, setSelectedPrice] = useState<Price | null>(null);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setHistoryModalOpen] = useState(false);

  const handleOpenEdit = (price: Price) => {
    setSelectedPrice(price);
    setEditModalOpen(true);
  };

  const handleOpenHistory = (price: Price) => {
    setSelectedPrice(price);
    setHistoryModalOpen(true);
  };

  const handlePriceUpdated = (updatedPrice: Price) => {
    setPrices((currentPrices) =>
      currentPrices.map((p) => (p.id === updatedPrice.id ? updatedPrice : p))
    );
    setEditModalOpen(false);
  };

  return (
    <div>
      <DataTable
        columns={columns({
          onEdit: handleOpenEdit,
          onShowHistory: handleOpenHistory,
        })}
        data={prices}
        filterColumnId="name"
        filterPlaceholder="Търсене по име на цена..."
        isLoading={false}
        emptyStateMessage="Няма намерени цени."
        renderMobileCard={(price: Price) => (
          <div className="p-5 transition-colors active:bg-zinc-50 dark:active:bg-zinc-900">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                {price.name}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-widest uppercase ${price.isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"}`}
                >
                  {price.isActive ? "Активна" : "Неактивна"}
                </span>
                <div className="flex rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEdit(price);
                    }}
                    className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-white hover:text-blue-600 dark:hover:bg-zinc-700"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenHistory(price);
                    }}
                    className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-white hover:text-amber-600 dark:hover:bg-zinc-700"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                      <path d="M12 7v5l4 2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-zinc-50 pt-3 dark:border-zinc-900">
              <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                {price.value.toFixed(2)} лв.
              </span>
              <span className="text-[10px] font-medium text-zinc-400">
                {new Date(price.updatedAt).toLocaleDateString("bg-BG")} (
                {price.updatedBy.userName})
              </span>
            </div>
          </div>
        )}
      />

      {selectedPrice && (
        <EditPriceDialog
          isOpen={isEditModalOpen}
          onClose={() => setEditModalOpen(false)}
          price={selectedPrice}
          onPriceUpdated={handlePriceUpdated}
        />
      )}

      {selectedPrice && (
        <PriceHistoryDialog
          isOpen={isHistoryModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          price={selectedPrice}
        />
      )}
    </div>
  );
}
