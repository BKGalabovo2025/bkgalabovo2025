
'use client';

import { useState } from 'react';
import { Price } from '@/types/index';
import { DataTable } from '@/components/shared/data-table';
import { columns } from './columns';
import { EditPriceDialog } from './edit-price-dialog';
import { PriceHistoryDialog } from './price-history-dialog';

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
    setPrices(currentPrices => 
        currentPrices.map(p => p.id === updatedPrice.id ? updatedPrice : p)
    );
    setEditModalOpen(false);
  };

  return (
    <div>
      <DataTable 
        columns={columns({ onEdit: handleOpenEdit, onShowHistory: handleOpenHistory })} 
        data={prices} 
        filterColumnId='name'
        filterPlaceholder='Търсене по име на цена...'
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
