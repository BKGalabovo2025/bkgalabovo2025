
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

import { getProducts } from '@/services/inventory-service';
import { getMembers } from '@/services/member-service';
import { createSale } from '@/services/sales-service';
import { Product, Member, SaleItem } from '@/types';

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface SaleFormValues {
    customerId?: string;
    customerName: string;
    customerType: 'member' | 'external';
}

export default function SalesPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [cart, setCart] = useState<SaleItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();
    const { toast } = useToast();
    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<SaleFormValues>({
        defaultValues: { customerType: 'external', customerName: '' }
    });

    const customerType = watch('customerType');

    useEffect(() => {
        async function loadInitialData() {
            try {
                setIsLoading(true);
                const [productsData, membersData] = await Promise.all([
                    getProducts(),
                    getMembers()
                ]);
                setProducts(productsData.filter(p => p.stock > 0)); // Показваме само продукти с наличност
                setMembers(membersData);
            } catch (err) {
                setError('Възникна грешка при зареждането на данните.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }
        loadInitialData();
    }, []);

    const addToCart = (product: Product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.productId === product.id);
            if (existingItem) {
                // Увеличаване на количеството, ако не надвишава наличността
                if (existingItem.quantity < product.stock) {
                  return prevCart.map(item => 
                      item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
                  );
                }
                toast({
                    title: 'Внимание',
                    description: `Не можете да добавите повече от наличните ${product.stock} бр. за "${product.name}".`,
                    variant: 'destructive'
                });
                return prevCart;
            }
            // Добавяне на нов артикул
            return [...prevCart, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prevCart => prevCart.filter(item => item.productId !== productId));
    };

    const updateQuantity = (productId: string, quantity: number) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        if (quantity > product.stock) {
             toast({
                title: 'Внимание',
                description: `Максимална наличност за "${product.name}" е ${product.stock} бр.`,
                variant: 'destructive'
            });
            quantity = product.stock;
        }

        if (quantity <= 0) {
            removeFromCart(productId);
        } else {
            setCart(prevCart => prevCart.map(item => 
                item.productId === productId ? { ...item, quantity } : item
            ));
        }
    };

    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const onSubmit = async (data: SaleFormValues) => {
        if (cart.length === 0) {
            toast({ title: 'Грешка', description: 'Количката е празна.', variant: 'destructive' });
            return;
        }

        let customerName = data.customerName;
        let customerId = undefined;

        if (data.customerType === 'member') {
            const selectedMember = members.find(m => m.id === data.customerId);
            if (!selectedMember) {
                toast({ title: 'Грешка', description: 'Моля, изберете валиден член на клуба.', variant: 'destructive' });
                return;
            }
            customerName = `${selectedMember.firstName} ${selectedMember.lastName}`;
            customerId = selectedMember.id;
        }

        if (!customerName.trim()) {
             toast({ title: 'Грешка', description: 'Моля, въведете име на клиента.', variant: 'destructive' });
            return;
        }

        setIsLoading(true);
        try {
            const newSaleId = await createSale({
                customerType: data.customerType,
                customerId,
                customerName,
                items: cart,
                totalAmount
            });
            toast({ title: 'Успех!', description: 'Продажбата е регистрирана успешно.' });
            // Пренасочваме към страницата за касова бележка
            router.push(`/sales/${newSaleId}`);
        } catch (error: any) {
            console.error(error);
            toast({ title: 'Грешка при продажба', description: error.message, variant: 'destructive' });
            setIsLoading(false);
        }
    };

    if (isLoading && products.length === 0) return <div>Зареждане...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Нова Продажба (POS)</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Списък с продукти */}
                <div className="md:col-span-1">
                    <h2 className="text-xl font-semibold mb-2">Продукти</h2>
                    <div className="space-y-2 max-h-screen overflow-y-auto">
                        {products.map(product => (
                            <div key={product.id} className="p-2 border rounded-md flex justify-between items-center">
                                <div>
                                    <p className='font-bold'>{product.name}</p>
                                    <p>{(product.price || 0).toFixed(2)} лв. (Наличност: {product.stock || 0})</p>
                                </div>
                                <Button onClick={() => addToCart(product)} size='sm'>Добави</Button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Количка и формуляр за клиент */}
                <div className="md:col-span-2">
                    <h2 className="text-xl font-semibold mb-2">Количка и Клиент</h2>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Количка */}
                        <div className="space-y-2 p-4 border rounded-lg min-h-[150px]">
                           {cart.length === 0 ? (
                               <p>Количката е празна</p>
                           ) : (
                               cart.map(item => (
                                   <div key={item.productId} className="flex justify-between items-center">
                                       <div>
                                           <p className='font-semibold'>{item.name}</p>
                                           <p>{(item.price || 0).toFixed(2)} лв.</p>
                                       </div>
                                       <div className='flex items-center gap-2'>
                                           <input 
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value, 10))}
                                                className='w-16 p-1 border rounded-md'
                                            />
                                           <Button variant='destructive' size='sm' onClick={() => removeFromCart(item.productId)}>X</Button>
                                       </div>
                                   </div>
                               ))
                           )}
                        </div>
                        
                        <div className='text-right font-bold text-lg'>
                            Общо: {totalAmount.toFixed(2)} лв.
                        </div>

                        {/* Информация за клиента */}
                        <div className="p-4 border rounded-lg space-y-4">
                             <h3 className="text-lg font-semibold">Клиент</h3>
                             <div>
                                 <label className="flex items-center gap-2">
                                     <input type="radio" value="external" {...register('customerType')} />
                                     Външен клиент
                                 </label>
                                 <label className="flex items-center gap-2">
                                     <input type="radio" value="member" {...register('customerType')} />
                                     Член на клуба
                                 </label>
                             </div>

                            {customerType === 'member' ? (
                                <div>
                                    <label htmlFor="customerId" className="block mb-1">Избери член:</label>
                                    <select 
                                        id="customerId"
                                        {...register('customerId', { required: 'Моля изберете член' })}
                                        className="w-full p-2 border rounded-md"
                                    >
                                        <option value="">-- Изберете --</option>
                                        {members.filter(member => member.status === 'active').map(member => (
                                            <option key={member.id} value={member.id}>{`${member.firstName} ${member.lastName}`}</option>
                                        ))}
                                    </select>
                                    {errors.customerId && <p className="text-red-500 text-sm">{errors.customerId.message}</p>}
                                </div>
                            ) : (
                                <div>
                                    <label htmlFor="customerName" className="block mb-1">Име на клиент:</label>
                                    <input 
                                        id="customerName" 
                                        type="text" 
                                        {...register('customerName', { required: 'Името е задължително' })}
                                        className="w-full p-2 border rounded-md"
                                    />
                                     {errors.customerName && <p className="text-red-500 text-sm">{errors.customerName.message}</p>}
                                </div>
                            )}
                        </div>

                        <Button type="submit" disabled={isLoading || cart.length === 0} className='w-full'>
                            {isLoading ? 'Обработка...' : 'Завърши продажбата'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
