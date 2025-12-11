
// src/app/inventory/page.tsx

import { Product, Stock, Sale } from '@/types';

const InventoryPage = () => {
  // Placeholder for inventory data
  const products: Product[] = [];
  const stock: Stock[] = [];
  const sales: Sale[] = [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Магазин и инвентар</h1>
      {/* Inventory management interface will go here */}
      <p>Управление на наличностите и продажбите.</p>
    </div>
  );
};

export default InventoryPage;
