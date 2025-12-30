'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

import { getAllMembers } from '@/services/member-service';
import { addSale } from '@/services/sales-service';
import { useProducts } from '@/hooks/useProducts';
import { Product, Member, Sale } from '@/types';
import { formatCurrency } from '@/lib/currency';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft, PlusCircle, XCircle, ShoppingCart, UserPlus } from 'lucide-react';

type SaleItem = Sale['items'][0];

const NewSalePage = () => {
    const router = useRouter();
    const { toast } = useToast();

    const { products: allProducts, isLoading: productsLoading, error: productsError } = useProducts();
    const [members, setMembers] = useState<Member[]>([]);
    const [membersLoading, setMembersLoading] = useState(true);
    
    const [cart, setCart] = useState<SaleItem[]>([]);
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<Sale['status']>('completed');
    const [totalAmount, setTotalAmount] = useState(0);
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const membersData = await getAllMembers();
                setMembers(membersData);
            } catch (error) {
                console.error("Error fetching members:", error);
                toast({ title: "Error", description: "Failed to load members.", variant: "destructive" });
            } finally {
                setMembersLoading(false);
            }
        };
        fetchMembers();
    }, [toast]);

    const availableProducts = allProducts.filter(p => (p.quantity || 0) > 0);

    useEffect(() => {
        const newTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        setTotalAmount(newTotal);
    }, [cart]);

    const addToCart = (productId: string) => {
        const productToAdd = allProducts.find(p => p.id === productId);
        if (!productToAdd) return;

        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.productId === productId);
            const stock = productToAdd.quantity || 0;
            if (existingItem) {
                const newQuantity = existingItem.quantity + 1;
                if (newQuantity > stock) {
                    toast({ title: "Няма достатъчно наличност", description: `Има само ${stock} бр. от ${productToAdd.name}.`, variant: "destructive" });
                    return prevCart;
                }
                return prevCart.map(item => 
                    item.productId === productId ? { ...item, quantity: newQuantity } : item
                );
            } else {
                return [...prevCart, { 
                    productId: productToAdd.id, 
                    name: productToAdd.name, 
                    price: productToAdd.price, 
                    quantity: 1 
                }];
            }
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(cart.filter(item => item.productId !== productId));
    };

    const updateQuantity = (productId: string, quantity: number) => {
        const productInCart = allProducts.find(p => p.id === productId);
        const stock = productInCart?.quantity || 0;
        if (quantity <= 0) {
            removeFromCart(productId);
        } else if (quantity > stock) {
             toast({ title: "Няма достатъчно наличност", description: `Максимално количество: ${stock}`, variant: "destructive" });
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
                memberId: selectedMemberId && selectedMemberId !== 'none' ? selectedMemberId : '',
                status: paymentStatus,
                currency: 'EUR', // Enforce EUR as per user instruction
            });

            toast({ title: "Успех!", description: "Продажбата е създадена успешно." });
            router.push('/sales');
        } catch (error: any) {
            console.error("Error creating sale:", error);
            toast({ title: "Грешка", description: error.message || "Възникна проблем при създаването на продажбата.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isLoading = productsLoading || membersLoading;

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin" /></div>;
    }
    
    if (productsError) {
        return <div className="text-center py-10 text-red-500">{productsError.message}</div>;
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
                                    {availableProducts.map(product => (
                                        <TableRow key={product.id}>
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                                            <TableCell className="text-right">{product.quantity}</TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" onClick={() => addToCart(product.id)} disabled={(product.quantity || 0) === 0}>
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
                                <Select onValueChange={setSelectedMemberId} defaultValue={'none'}>
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
                                    <span>{formatCurrency(totalAmount)}</span>
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
