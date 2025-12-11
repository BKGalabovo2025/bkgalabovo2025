
import { db } from '@/lib/firebase';
import { collection, doc, runTransaction, Timestamp, getDocs, query, where, orderBy, getDoc } from 'firebase/firestore';
import { Sale, Product } from '@/types';

// Помощна функция за конвертиране на документ от Firestore в обект Sale
const docToSale = (doc: any): Sale => {
    const data = doc.data();
    // Конвертираме Timestamp към ISO низ, за да съвпада с типа
    const date = data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date;
    return {
        id: doc.id,
        ...data,
        date,
    } as Sale;
};


/**
 * Регистрира нова продажба, актуализира наличностите на продуктите и записва финансовата транзакция.
 * Използва транзакция, за да гарантира атомарност.
 * @param saleData - Данни за продажбата, без ID и дата.
 * @returns Promise, което връща ID-то на новосъздадената продажба.
 */
export const createSale = async (saleData: Omit<Sale, 'id' | 'date'>): Promise<string> => {

  const saleRef = doc(collection(db, 'sales'));

  await runTransaction(db, async (transaction) => {
    // 1. Проверка на наличностите и подготовка за актуализация
    const productUpdates: { ref: any, newStock: number }[] = [];

    for (const item of saleData.items) {
      const productRef = doc(db, 'products', item.productId);
      const productDoc = await transaction.get(productRef);

      if (!productDoc.exists()) {
        throw new Error(`Продукт с ID ${item.productId} не беше намерен.`);
      }

      const product = productDoc.data() as Product;
      const newStock = product.stock - item.quantity;

      if (newStock < 0) {
        throw new Error(`Няма достатъчна наличност за продукта "${product.name}". Налични: ${product.stock}, Искани: ${item.quantity}`);
      }
      
      productUpdates.push({ ref: productRef, newStock });
    }

    // 2. Създаване на записа за продажба
    // Гарантираме, че customerId е null, а не undefined
    transaction.set(saleRef, {
      ...saleData,
      customerId: saleData.customerId || null,
      date: Timestamp.now(),
    });

    // 3. Актуализиране на наличностите на продуктите
    for (const update of productUpdates) {
      transaction.update(update.ref, { stock: update.newStock });
    }

    // 4. Създаване на финансов запис
    const financeRef = doc(collection(db, 'finances'));
    transaction.set(financeRef, {
        date: Timestamp.now(),
        description: `Продажба #${saleRef.id.substring(0, 6)} на ${saleData.customerName}`,
        amount: saleData.totalAmount,
        type: 'income',
        memberId: saleData.customerId || null,
    });
  });

  return saleRef.id;
};

/**
 * Връща конкретна продажба по нейното ID.
 * @param saleId - ID на продажбата.
 * @returns Promise, което връща обект Sale или null, ако не е намерена.
 */
export const getSaleById = async (saleId: string): Promise<Sale | null> => {
    const saleDocRef = doc(db, 'sales', saleId);
    const saleDoc = await getDoc(saleDocRef);

    if (!saleDoc.exists()) {
        return null;
    }

    return docToSale(saleDoc);
};

/**
 * Връща всички продажби, сортирани по дата в низходящ ред.
 * @returns Promise, което връща масив с всички продажби.
 */
export const getSales = async (): Promise<Sale[]> => {
    const salesCollection = collection(db, 'sales');
    const q = query(salesCollection, orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToSale);
};

/**
 * Връща всички продажби за конкретен член.
 * @param memberId - ID на члена.
 * @returns Promise, което връща масив с продажбите на члена.
 */
export const getSalesByMemberId = async (memberId: string): Promise<Sale[]> => {
    const salesCollection = collection(db, 'sales');
    const q = query(salesCollection, where('customerId', '==', memberId), orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToSale);
};

/**
 * Изтрива продажба, възстановява наличностите и премахва свързания финансов запис.
 * @param saleId - ID на продажбата за изтриване.
 * @param sale - Обектът на продажбата, съдържащ продуктите и сумата.
 */
export const deleteSale = async (saleId: string, sale: Sale): Promise<void> => {
    const saleRef = doc(db, 'sales', saleId);

    await runTransaction(db, async (transaction) => {
        // 1. Възстановяване на наличностите на продуктите
        for (const item of sale.items) {
            const productRef = doc(db, 'products', item.productId);
            const productDoc = await transaction.get(productRef);

            if (productDoc.exists()) {
                const currentStock = productDoc.data().stock || 0;
                transaction.update(productRef, { stock: currentStock + item.quantity });
            }
        }

        // 2. Намиране и изтриване на свързания финансов запис
        // Това е по-сложно, тъй като нямаме директна връзка.
        // Ще използваме заявка, за да го намерим по описание и сума.
        const financeQuery = query(
            collection(db, 'finances'),
            where('description', '==', `Продажба #${saleId.substring(0, 6)} на ${sale.customerName}`),
            where('amount', '==', sale.totalAmount),
            where('type', '==', 'income')
        );
        
        const financeDocs = await getDocs(financeQuery);
        financeDocs.forEach(doc => {
            transaction.delete(doc.ref);
        });

        // 3. Изтриване на самата продажба
        transaction.delete(saleRef);
    });
};
