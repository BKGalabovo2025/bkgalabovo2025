'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { deleteSale, getSaleById, updateSale } from '@/services/sales-service';
import { getMemberById } from '@/services/member-service';
import { Sale, Member } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { formatPrice } from '@/lib/currency';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, User, ShoppingCart, Trash2, CheckCheck, FilePenLine, Receipt } from 'lucide-react';

const SaleDetailsPage = () => {
  const [sale, setSale] = useState<Sale | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const saleId = params.id as string;

  useEffect(() => {
    if (saleId) {
      const fetchSaleData = async () => {
        try {
          setLoading(true);
          const saleData = await getSaleById(saleId);
          setSale(saleData);
          if (saleData?.memberId) {
            const memberData = await getMemberById(saleData.memberId);
            setMember(memberData);
          } else {
            setMember(null);
          }
        } catch (error) {
          console.error("Error loading sale data:", error);
           toast({ title: "Error", description: "Failed to load data.", variant: "destructive" });
        } finally {
          setLoading(false);
        }
      };
      fetchSaleData();
    }
  }, [saleId, toast]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
        await deleteSale(saleId);
        toast({ title: "Success!", description: "Sale was deleted." });
        router.push('/sales');
    } catch (error: any) {
        console.error("Error deleting sale:", error);
        toast({ title: "Error", description: error.message || "An error occurred while deleting the sale.", variant: "destructive" });
    } finally {
        setIsDeleting(false);
    }
  }

  const handleMarkAsPaid = async () => {
    setIsUpdatingStatus(true);
    try {
      await updateSale(saleId, { status: 'completed', isPaid: true });
      setSale(prevSale => prevSale ? { ...prevSale, status: 'completed', isPaid: true } : null);
      toast({
        title: "Success!",
        description: "Payment was registered.",
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "An error occurred while updating the status.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading data...</p>
      </div>
    );
  }

  if (!sale) {
    return <div className="text-center py-10">Sale information not found.</div>;
  }
  
  const isPaid = sale.isPaid;
  const currency = sale.currency || 'EUR'; // Ensure currency is always defined

  return (
    <div className="p-4 sm:p-6">
      <Button variant="outline" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sales
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Sale # {sale.id.substring(0, 8)}</CardTitle>
                    <CardDescription>Date: {new Date(sale.saleDate).toLocaleString('en-US')}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={() => router.push(`/sales/${saleId}/receipt`)}>
                        <Receipt className="mr-2 h-4 w-4" /> Receipt
                    </Button>
                    <Button variant="outline" onClick={() => router.push(`/sales/${saleId}/edit`)}>
                        <FilePenLine className="mr-2 h-4 w-4" /> Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure you want to delete this sale?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. The sale will be permanently deleted and the stock levels of the products will be restored.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Confirm
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardHeader>
            <CardContent>
                <h3 className="font-semibold mb-2 text-lg flex items-center"><ShoppingCart className="mr-2 h-5 w-5"/>Items</h3>
                <div className="border rounded-md">
                    <ul className="divide-y">
                        {sale.items.map((item, index) => (
                            <li key={item.productId || index} className="p-3 flex justify-between items-center">
                                <div>
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {item.quantity} x {formatPrice(item.price)}
                                    </p>
                                </div>
                                <p className="font-semibold">{formatPrice(item.quantity * item.price)}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </CardContent>
            <CardFooter className="bg-muted/40 p-4 flex justify-end">
                 <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total</p>
                     <p className="font-bold text-2xl">{formatPrice(sale.totalAmount)}</p>
                </div>
            </CardFooter>
          </Card>
        </div>

        <div>
            <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center"><User className="mr-2 h-5 w-5"/>Client</CardTitle>
                </CardHeader>
                <CardContent>
                    {sale.memberId && member ? (
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={member.avatarUrl ?? undefined} alt={`${member.firstName} ${member.lastName}`} />
                                <AvatarFallback>{member.firstName && member.lastName ? `${member.firstName[0]}${member.lastName[0]}` : ''}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-bold text-lg">{member.firstName} {member.lastName}</p>
                                <p className="text-sm text-muted-foreground">{member.email ?? 'No email'}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">Walk-in sale</p>
                    )}
                </CardContent>
                {member && (
                     <CardFooter>
                        <Button variant="outline" className="w-full" onClick={() => router.push(`/members/${member.id}`)}>View Profile</Button>
                    </CardFooter>
                )}
            </Card>
            
            <Card className="mt-6">
                 <CardHeader>
                    <CardTitle>Payment Status</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-start gap-4">
                     <Badge variant={isPaid ? 'success' : 'destructive'} className="text-base px-4 py-1">
                        {isPaid ? 'Paid' : 'Unpaid'}
                    </Badge>

                    {!isPaid && (
                        <Button onClick={handleMarkAsPaid} disabled={isUpdatingStatus} className="w-full mt-2">
                            {isUpdatingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCheck className="mr-2 h-4 w-4" />}
                            Mark as Paid
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
};

export default SaleDetailsPage;
