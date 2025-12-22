'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

import { getProducts } from '@/services/inventory-service';
import { getAllMembers } from '@/services/member-service';
import { addSale } from '@/services/sales-service';
import { Product, Member, SaleItem, Sale } from '@/types';
import { formatCurrency } from '@/lib/currency';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft, PlusCircle, XCircle, ShoppingCart, UserPlus } from 'lucide-react';

const NewSalePage = () => {
    const router = useRouter();
    const { toast } = useToast();

    const [products, setProducts] = useState<Product[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    
    const [cart, setCart] = useState<SaleItem[]>([]);
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<'paid' | 'deferred'>('paid');
    const [total, setTotal] = useState(0);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productsData, membersData] = await Promise.all([
                    getProducts(),
                    getAllMembers()
                ]);
                setProducts(productsData);
                setMembers(membersData);
            } catch (error) {
                console.error("Грешка при зареждане на данни:", error);
                toast({ title: "Грешка", description: "Неуспешно зареждане на продукти или членове.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [toast]);

    useEffect(() => {
        const newTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        setTotal(newTotal);
    }, [cart]);

    const addToCart = (productId: string) => {
        const productToAdd = products.find(p => p.id === productId);
        if (!productToAdd) return;

        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.productId === productId);
            if (existingItem) {
                return prevCart.map(item => 
                    item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
                );
            } else {
                return [...prevCart, { productId: productToAdd.id, name: productToAdd.name, price: productToAdd.price, quantity: 1 }];
            }
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(cart.filter(item => item.productId !== productId));
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
        } else {
            setCart(cart.map(item => item.productId === productId ? { ...item, quantity } : item));
        }
    };

    const handleCreateSale = async () => {
        if (cart.length === 0) {
            toast({ title: "Празна количка", description: "Добавете поне един продукт.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            await addSale({
                date: new Date().toISOString(),
                items: cart,
                total: total,
                memberId: selectedMemberId && selectedMemberId !== 'none' ? selectedMemberId : null,
                status: paymentStatus === 'paid' ? 'completed' : 'pending', 
                currency: 'EUR', // <-- SET CURRENCY TO EUR
            } as Omit<Sale, 'id'>);

            toast({ title: "Успех!", description: "Продажбата е създадена успешно." });
            router.push('/sales');
        } catch (error) {
            console.error("Грешка при създаване на продажба:", error);
            toast({ title: "Грешка", description: "Възникна проблем при създаването на продажбата.", variant: "destructive" });
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin" /></div>;
    }

    return (
        <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
                <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Обратно</Button>
                <h1 className="text-2xl font-bold">Нова продажба</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Продукти</CardTitle>
                            <CardDescription>Изберете продукти, които да добавите към продажбата.</CardDescription>
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
                                    {products.map(product => (
                                        <TableRow key={product.id}>
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                                            <TableCell className="text-right">{product.stock}</TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" onClick={() => addToCart(product.id)} disabled={product.stock === 0}>
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
                                <Select onValueChange={setSelectedMemberId} defaultValue={selectedMemberId || 'none'}>
                                    <SelectTrigger><SelectValue placeholder="Избери член (по желание)" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Външен клиент</SelectItem>
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
                                                <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Input 
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={e => updateQuantity(item.productId, parseInt(e.target.value))}
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
                                    <RadioGroup defaultValue="paid" value={paymentStatus} onValueChange={(value: 'paid' | 'deferred') => setPaymentStatus(value)} className="flex space-x-4">
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="paid" id="r-paid" />
                                            <Label htmlFor="r-paid">Платено</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="deferred" id="r-deferred" />
                                            <Label htmlFor="r-deferred">Отложено</Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                <div className="flex justify-between font-bold text-lg w-full pt-4 border-t">
                                    <span>Общо:</span>
                                    <span>{formatCurrency(total)}</span>
                                </div>
                                <Button onClick={handleCreateSale} className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Завърши продажбата
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default NewSalePage;
