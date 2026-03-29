'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { getSaleById, updateSale } from '@/services/sales-service';
import { getAllMembers } from '@/services/member-service';
import { useProducts } from '@/hooks/useProducts';
import { Member, Sale, Product } from '@/types';
import { formatPrice } from '@/lib/currency';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, PlusCircle, XCircle, ShoppingCart, UserPlus } from 'lucide-react';

type SaleItem = Sale['items'][0];

const EditSalePage = () => {
    const router = useRouter();
    const params = useParams();
    const saleId = params.id as string;

    const { products: allProducts, isLoading: productsLoading, error: productsError } = useProducts();
    const [members, setMembers] = useState<Member[]>([]);
    const [membersLoading, setMembersLoading] = useState(true);
    
    const [cart, setCart] = useState<SaleItem[]>([]);
    const [selectedMemberId, setSelectedMemberId] = useState<string>('none');
    const [paymentStatus, setPaymentStatus] = useState<Sale['status']>('completed');
    const [totalAmount, setTotalAmount] = useState(0);
    const [initialSale, setInitialSale] = useState<Sale | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!saleId) return;
            try {
                setPageLoading(true);
                const [saleData, membersData] = await Promise.all([
                    getSaleById(saleId),
                    getAllMembers(),
                ]);

                if (!saleData) {
                    toast.error("Грешка", { description: "Продажбата не е намерена." });
                    router.push('/sales');
                    return;
                }

                setInitialSale(saleData);
                setCart(saleData.items);
                setSelectedMemberId(saleData.memberId || 'none');
                setPaymentStatus(saleData.status);
                setMembers(membersData);

            } catch (error) {
                console.error("Error fetching data:", error);
                toast.error("Грешка при зареждане", { description: "Неуспешно зареждане на данните за редактиране." });
            } finally {
                setMembersLoading(false);
                setPageLoading(false);
            }
        };

        fetchInitialData();
    }, [saleId, router]);

    useEffect(() => {
        const newTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        setTotalAmount(newTotal);
    }, [cart]);

    const addToCart = (product: Product) => {
        if (!product) return;

        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.productId === product.id);
            const stock = product.stock || 0;
            if (existingItem) {
                const newQuantity = existingItem.quantity + 1;
                if (newQuantity > stock) {
                    toast.error("Няма наличност", { description: `Само ${stock} бр. от ${product.name} са налични.` });
                    return prevCart;
                }
                return prevCart.map(item => 
                    item.productId === product.id ? { ...item, quantity: newQuantity } : item
                );
            } else {
                if (stock < 1) {
                    toast.error("Няма наличност", { description: `Продуктът ${product.name} е изчерпан.` });
                    return prevCart;
                }
                return [...prevCart, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
            }
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(cart.filter(item => item.productId !== productId));
    };

    const updateQuantity = (productId: string, quantity: number) => {
        const productInCart = allProducts.find(p => p.id === productId);
        const originalItem = initialSale?.items.find(item => item.productId === productId);
        const originalQuantity = originalItem?.quantity || 0;
        const stock = (productInCart?.stock || 0) + originalQuantity;

        if (quantity <= 0) {
            removeFromCart(productId);
        } else if (quantity > stock) {
             toast.error("Няма наличност", { description: `Максималното налично количество е ${stock}.` });
        } else {
            setCart(cart.map(item => item.productId === productId ? { ...item, quantity } : item));
        }
    };

    const handleUpdateSale = async () => {
        if (cart.length === 0) {
            toast.error("Празна количка", { description: "Моля, добавете поне един продукт." });
            return;
        }

        setIsSubmitting(true);
        try {
            await updateSale(saleId, {
                items: cart,
                memberId: selectedMemberId === 'none' ? undefined : selectedMemberId,
                status: paymentStatus,
            });

            toast.success("Успех!", { description: "Продажбата е актуализирана успешно." });
            router.push(`/sales/${saleId}`);
        } catch (error) {
            const err = error as Error;
            console.error("Error updating sale:", err);
            toast.error("Грешка", { description: err.message || "Възникна грешка при обновяване на продажбата." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const availableProducts = useMemo(() => allProducts.filter(p => {
        const itemInCart = cart.find(item => item.productId === p.id);
        const cartQuantity = itemInCart?.quantity || 0;
        const originalItem = initialSale?.items.find(item => item.productId === p.id);
        const originalQuantity = originalItem?.quantity || 0;
        const currentStock = (p.stock || 0) + originalQuantity;
        return currentStock - cartQuantity > 0;
    }), [allProducts, cart, initialSale]);

    const isLoading = productsLoading || membersLoading || isPageLoading;

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin" /> Зареждане...</div>;
    }
    
    if (productsError) {
        return <div className="text-center py-10 text-red-500">Възникна грешка при извличане на продуктите.</div>;
    }

    return (
        <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
                <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Назад</Button>
                <h1 className="text-2xl font-bold">Редактиране на продажба</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Продукти</CardTitle>
                            <CardDescription>Променете продуктите в продажбата.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Продукт</TableHead>
                                        <TableHead className="text-right">Цена</TableHead>
                                        <TableHead className="text-right">Наличност</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {availableProducts.map(product => (
                                        <TableRow key={product.id}>
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell className="text-right">{formatPrice(product.price)}</TableCell>
                                            <TableCell className="text-right">{product.stock}</TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" onClick={() => addToCart(product)} >
                                                    <PlusCircle className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card className="sticky top-6">
                        <CardHeader>
                            <CardTitle className="flex items-center"><ShoppingCart className="mr-2"/>Количка</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="flex items-center gap-2 mb-4">
                                <UserPlus className="h-5 w-5"/>
                                <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                                    <SelectTrigger><SelectValue placeholder="Изберете член (по желание)" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Случаен клиент</SelectItem>
                                        {members.map(member => (
                                            <SelectItem key={member.id} value={member.id}>{member.firstName} {member.lastName}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                {cart.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-4">Количката е празна.</p>
                                ) : (
                                    cart.map(item => (
                                        <div key={item.productId} className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{item.name}</p>
                                                <p className="text-sm text-muted-foreground">{formatPrice(item.price)}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Input 
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={e => updateQuantity(item.productId, parseInt(e.target.value) || 0)}
                                                    className="w-16 h-8"
                                                />
                                                <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.productId)}>
                                                    <XCircle className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                        {cart.length > 0 && (
                            <CardFooter className="flex-col items-start gap-4">
                                <div className="space-y-2 w-full">
                                    <Label>Статус на плащане</Label>
                                    <RadioGroup value={paymentStatus} onValueChange={(value) => setPaymentStatus(value as Sale['status'])} className="flex space-x-4">
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="completed" id="r-paid" />
                                            <Label htmlFor="r-paid">Платено</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="pending" id="r-deferred" />
                                            <Label htmlFor="r-deferred">Отложено</Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                <div className="flex justify-between font-bold text-lg w-full pt-4 border-t">
                                    <span>Общо:</span>
                                    <span>{formatPrice(totalAmount)}</span>
                                </div>
                                <Button onClick={handleUpdateSale} className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Запази промените
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default EditSalePage;
