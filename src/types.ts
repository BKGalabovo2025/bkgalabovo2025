
// src/types.ts

/**
 * Represents a club member.
 */
export interface Member {
  id: string;          
  firstName: string;   
  lastName: string;    
  email?: string;      
  phone?: string;      
  joinDate: string;    
  isActive: boolean;   
}

/**
 * Represents a single payment record, typically for membership fees or other one-off payments.
 */
export interface Payment {
  id: string;
  memberId: string;
  amount: number;
  paymentDate: string; // ISO string
  type: 'membership_fee' | 'donation' | 'other';
}

/**
 * Represents a product in the inventory.
 */
export interface Product {
    id: string;        
    name: string;      
    price: number;     
    stock: number;     
    imageUrl?: string; 
}

/**
 * Represents an individual item within a sale.
 */
export interface SaleItem {
  productId: string; 
  name: string;      
  price: number;     
  quantity: number;  
}

/**
 * Represents a completed sale transaction.
 */
export interface Sale {
  id: string;                  
  date: string;                
  items: SaleItem[];           
  totalAmount: number;         
  memberId?: string;         
  customerName: string;      
}
