
// src/types.ts

/**
 * Представлява член на клуба.
 */
export interface Member {
  id: string;          // Уникален идентификатор
  name: string;        // Име на члена
  email?: string;      // Имейл (опционално)
  phone?: string;      // Телефон (опционално)
  joinDate: string;    // Дата на присъединяване (ISO string)
  isActive: boolean;   // Дали членството е активно
}

/**
 * Представлява финансов запис.
 */
export interface FinanceRecord {
  id: string;              // Уникален идентификатор
  date: string;            // Дата на транзакцията (ISO string)
  description: string;     // Описание
  amount: number;          // Сума (положителна за приход, отрицателна за разход)
  type: 'income' | 'expense'; // Тип на транзакцията
  memberId?: string;       // ID на свързан член (опционално)
}

/**
 * Представлява продукт от инвентара.
 */
export interface Product {
    id: string;              // Уникален идентификатор
    name: string;            // Име на продукта
    price: number;           // Цена
    stock: number;           // Наличност
    imageUrl?: string;       // URL на снимката (опционално)
}

/**
 * Представлява отделен артикул в рамките на една продажба.
 */
export interface SaleItem {
  productId: string;   // ID на продукта
  name: string;        // Име на продукта (денормализирано за лесно показване)
  price: number;       // Цена на продукта към момента на продажбата
  quantity: number;    // Продадено количество
}

/**
 * Представлява продажба.
 */
export interface Sale {
  id: string;                    // Уникален идентификатор на продажбата
  date: string;                  // Дата на продажбата (ISO string)
  items: SaleItem[];             // Масив с продадените артикули
  totalAmount: number;           // Обща сума на продажбата
  customerType: 'member' | 'external'; // Тип на клиента
  customerId?: string;           // ID на члена (ако е член на клуба)
  customerName: string;          // Име на клиента (име на члена или въведено име)
}
