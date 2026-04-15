import { describe, it, expect } from 'vitest';
import { docToSale } from '../sales-service';
import { DocumentSnapshot } from 'firebase/firestore';

// Mock DocumentSnapshot
const mockDoc = (id: string, data: Record<string, unknown>, exists: boolean = true) => ({
  id,
  exists: () => exists,
  data: () => data,
} as unknown as DocumentSnapshot);

describe('sales-service', () => {
  describe('docToSale', () => {
    it('should return null if doc does not exist', () => {
      const doc = mockDoc('1', {}, false);
      expect(docToSale(doc)).toBeNull();
    });

    it('should parse valid sale data correctly', () => {
      const mockDate = new Date('2024-01-01T10:00:00Z');
      const data = {
        memberId: 'm1',
        saleDate: { toDate: () => mockDate },
        items: [{ productId: 'p1', name: 'Item 1', quantity: 2, price: 10 }],
        status: 'completed',
        currency: 'EUR',
        totalAmount: 20,
        isPaid: true,
        subscriptionId: 's1',
      };
      
      const doc = mockDoc('sale1', data);
      const result = docToSale(doc);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('sale1');
      expect(result?.memberId).toBe('m1');
      expect(result?.saleDate).toBe(mockDate.toISOString());
      expect(result?.totalAmount).toBe(20);
      expect(result?.items).toHaveLength(1);
    });

    it('should handle missing fields with defaults', () => {
      const data = {
        memberId: 'm1',
        totalAmount: '15.50', // Test string to number conversion
      };
      
      const doc = mockDoc('sale2', data);
      const result = docToSale(doc);

      expect(result).not.toBeNull();
      expect(result?.totalAmount).toBe(15.5);
      expect(result?.currency).toBe('EUR'); // Default
      expect(result?.status).toBe('completed'); // Default
      expect(result?.isPaid).toBe(true); // Default
    });

    it('should use current date if saleDate is missing', () => {
      const data = { memberId: 'm1' };
      const doc = mockDoc('sale3', data);
      const result = docToSale(doc);
      
      expect(result?.saleDate).toBeDefined();
      expect(new Date(result!.saleDate).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });
});
