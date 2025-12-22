'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSaleById, deleteSale } from '@/services/sales-service';
import { getMemberById } from '@/services/member-service';
import { Sale, Member } from '@/types';
import { useToast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Printer, Trash2, Mail } from 'lucide-react';
import Image from 'next/image';
import { clubInfo } from '@/config/club';
import { PrintableReceipt } from '@/components/sales/PrintableReceipt';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SaleReceiptPage = () => {
    const [sale, setSale] = useState<Sale | null>(null);
    const [member, setMember] = useState<Member | null>(null);
    const [loading, setLoading] = useState(true);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showEmailDialog, setShowEmailDialog] = useState(false);
    const [emailToSend, setEmailToSend] = useState('');
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const saleId = params.id as string;

    useEffect(() => {
        if (saleId) {
            const fetchSaleData = async () => {
                setLoading(true);
                try {
                    const saleData = await getSaleById(saleId);
                    setSale(saleData);
                    if (saleData && saleData.memberId) {
                        const memberData = await getMemberById(saleData.memberId);
                        setMember(memberData);
                        if (memberData && memberData.email) {
                            setEmailToSend(memberData.email);
                        }
                    }
                } catch (error) {
                    console.error("Грешка при зареждане на продажбата:", error);
                    toast({ title: "Грешка", description: "Неуспешно зареждане на данните за продажбата.", variant: "destructive" });
                } finally {
                    setLoading(false);
                }
            };
            fetchSaleData();
        }
    }, [saleId, toast]);

    const handlePrint = async () => {
        if (!sale) return;
        try {
            const { renderToString } = await import('react-dom/server');
            const printableComponent = <PrintableReceipt sale={sale} member={member} />;
            const printContent = renderToString(printableComponent);
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                toast({ title: "Грешка при принтиране", description: "Прозорецът за печат е блокиран от браузъра.", variant: "destructive" });
                return;
            }
            const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
            const stylesHTML = styles.map(style => style.outerHTML).join('');
            const receiptTitle = sale.paymentStatus === 'deferred' ? 'Проформа Стокова Разписка' : 'Стокова Разписка';
            printWindow.document.write(`
                <html>
                    <head>
                        <title>${receiptTitle}</title>
                        ${stylesHTML}
                    </head>
                    <body>${printContent}</body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        } catch (error) {
            console.error("Error during printing:", error);
            toast({ title: "Грешка при принтиране", description: "Възникна неочаквана грешка.", variant: "destructive" });
        }
    };

    const handleDelete = async () => {
        setShowDeleteDialog(false);
        try {
            await deleteSale(saleId);
            toast({ title: "Успех!", description: "Продажбата беше изтрита успешно." });
            router.push('/sales');
        } catch (error) {
            console.error("Грешка при изтриване на продажба:", error);
            toast({ title: "Грешка", description: "Възникна проблем при изтриването на продажбата.", variant: "destructive" });
        }
    };

    const generateReceiptHtml = (currentSale: Sale, currentMember: Member | null): string => {
        const isDeferred = currentSale.paymentStatus === 'deferred';
        const receiptTitle = isDeferred ? 'ПРОФОРМА СТОКОВА РАЗПИСКА' : 'СТОКОВА РАЗПИСКА';
        const statusText = isDeferred ? 'НЕПЛАТЕНО' : 'ПЛАТЕНО';
        const statusColor = isDeferred ? '#ef4444' : '#22c55e';

        const styles = {
            body: `font-family: Arial, sans-serif; color: #333;`,
            header: `border-bottom: 2px solid #eee; padding-bottom: 15px;`,
            h1: `font-size: 24px; font-weight: bold; margin: 0;`,
            status: `font-size: 1.5em; font-weight: bold; color: ${statusColor}; margin-top: 10px;`,
            table: `width: 100%; border-collapse: collapse; margin-top: 20px;`,
            th: `text-align: left; padding: 8px; border-bottom: 1px solid #ddd; background-color: #f9f9f9;`,
            td: `padding: 8px; border-bottom: 1px solid #ddd;`,
            total: `font-size: 1.2em; font-weight: bold;`,
            footer: `margin-top: 20px; font-size: 0.8em; color: #777; text-align: center;`
        };

        const itemsHtml = currentSale.items.map(item => `
            <tr>
                <td style="${styles.td}">${item.name}</td>
                <td style="${styles.td}; text-align: center;">${item.quantity}</td>
                <td style="${styles.td}; text-align: right;">${(item.price || 0).toFixed(2)} лв.</td>
                <td style="${styles.td}; text-align: right;">${((item.quantity || 0) * (item.price || 0)).toFixed(2)} лв.</td>
            </tr>
        `).join('');

        return `
            <div style="${styles.body}">
                <div style="${styles.header}">
                    <h1 style="${styles.h1}">${receiptTitle}</h1>
                    <p>№ ${currentSale.id.substring(0, 8)} / ${new Date(currentSale.date).toLocaleDateString('bg-BG')}</p>
                </div>
                 <div style="${styles.status}">${statusText}</div>
                <p><strong>Издал:</strong> ${clubInfo.name}</p>
                <p><strong>Получател:</strong> ${currentMember ? `${currentMember.firstName} ${currentMember.lastName}` : 'Външен клиент'}</p>
                <table style="${styles.table}">
                    <thead>
                        <tr>
                            <th style="${styles.th}">Артикул</th>
                            <th style="${styles.th}; text-align: center;">Количество</th>
                            <th style="${styles.th}; text-align: right;">Ед. цена</th>
                            <th style="${styles.th}; text-align: right;">Общо</th>
                        </tr>
                    </thead>
                    <tbody>${itemsHtml}</tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" style="${styles.td}; text-align: right; font-weight: bold;">ОБЩО:</td>
                            <td style="${styles.td}; text-align: right; ${styles.total}">${(currentSale.total || 0).toFixed(2)} лв.</td>
                        </tr>
                    </tfoot>
                </table>
                <div style="${styles.footer}">
                    <p>Настоящият документ удостоверява предаването на описаните артикули.</p>
                    ${isDeferred ? '<p>Това е проформа документ и не удостоверява плащане.</p>' : '<p>Този документ удостоверява извършено плащане.</p>'}
                </div>
            </div>
        `;
    };

    const handleSendEmail = async () => {
        if (!sale) return;
        if (!emailToSend || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToSend)) {
             toast({ title: "Грешка", description: "Моля, въведете валиден имейл адрес.", variant: "destructive" });
             return;
        }
        setIsSendingEmail(true);
        try {
            const receiptHtml = generateReceiptHtml(sale, member);
            const subject = sale.paymentStatus === 'deferred' 
                ? `Проформа разписка от ${clubInfo.name}` 
                : `Разписка от ${clubInfo.name}`;

            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: emailToSend, subject, html: receiptHtml }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Грешка при изпращането на имейл.');
            }
            
            toast({ title: "Успех!", description: "Разписката беше изпратена успешно." });
            setShowEmailDialog(false);

        } catch (error: any) {
            console.error("Грешка при изпращане на имейл:", error);
            toast({ title: "Грешка", description: error.message, variant: "destructive" });
        } finally {
            setIsSendingEmail(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    if (!sale) {
        return <div className="text-center py-10">Продажбата не е намерена.</div>;
    }

    const isDeferred = sale.paymentStatus === 'deferred';
    const receiptTitle = isDeferred ? 'ПРОФОРМА СТОКОВА РАЗПИСКА' : 'СТОКОВА РАЗПИСКА';
    const statusText = isDeferred ? 'НЕПЛАТЕНО' : 'ПЛАТЕНО';
    const statusColor = isDeferred ? 'text-red-600' : 'text-green-600';

    return (
        <div className="bg-muted/50 print:bg-white">
            <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="flex items-center justify-between mb-6 print:hidden">
                    <Button variant="outline" onClick={() => router.push('/sales')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Всички продажби
                    </Button>
                    <div className="flex items-center gap-2">
                         <Button variant="outline" onClick={() => setShowEmailDialog(true)}>
                            <Mail className="mr-2 h-4 w-4" /> Изпрати
                        </Button>
                        <Button variant="outline" onClick={handlePrint}>
                            <Printer className="mr-2 h-4 w-4" /> Принтирай
                        </Button>
                        <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Изтрий
                        </Button>
                    </div>
                </div>

                <div className="bg-white p-8 border border-border shadow-sm print:border-none print:shadow-none">
                    <header className="flex justify-between items-start pb-6 border-b-2 border-border">
                        <div className="flex items-center gap-4">
                            <Image src="/logo.png" alt="Club Logo" width={60} height={60} />
                        </div>
                        <div className="text-right">
                            <h1 className="text-3xl font-bold tracking-wider">{receiptTitle}</h1>
                            <p className="text-sm text-muted-foreground mt-1">№ {sale.id.substring(0, 8)} / {new Date(sale.date).toLocaleDateString('bg-BG')}</p>
                        </div>
                    </header>

                    <section className="mt-8 grid grid-cols-2 gap-8">
                        <div>
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">ИЗДАЛ:</h2>
                            <p className="font-bold mt-2">{clubInfo.name}</p>
                            <p className="text-sm text-muted-foreground">{clubInfo.address}</p>
                            <p className="text-sm text-muted-foreground">тел: {clubInfo.contact}</p>
                            <p className="text-sm text-muted-foreground">e-mail: {clubInfo.email}</p>
                            <p className="text-sm text-muted-foreground">{clubInfo.website}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">ПОЛУЧАТЕЛ:</h2>
                            {member ? (
                                <>
                                    <p className="font-bold mt-2">{member.firstName} {member.lastName}</p>
                                    <p className="text-sm text-muted-foreground">Редовен член на клуба</p>
                                </>
                            ) : (
                                <p className="font-bold mt-2">Външен клиент</p>
                            )}
                        </div>
                    </section>

                     <div className={`mt-8 text-center text-3xl font-bold ${statusColor}`}>
                        {statusText}
                    </div>

                    <section className="mt-10">
                        <table className="w-full text-sm">
                            <thead className="border-b border-border">
                                <tr>
                                    <th className="text-left font-semibold text-muted-foreground p-2">Артикул</th>
                                    <th className="text-center font-semibold text-muted-foreground p-2">Кол.</th>
                                    <th className="text-right font-semibold text-muted-foreground p-2">Ед. цена</th>
                                    <th className="text-right font-semibold text-muted-foreground p-2">Общо</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sale.items.map((item) => (
                                    <tr key={item.productId}>
                                        <td className="p-2 font-medium">{item.name}</td>
                                        <td className="text-center p-2">{item.quantity}</td>
                                        <td className="text-right p-2">{(item.price || 0).toFixed(2)} лв.</td>
                                        <td className="text-right p-2">{((item.quantity || 0) * (item.price || 0)).toFixed(2)} лв.</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="border-t-2 border-border">
                                <tr>
                                    <td colSpan={3} className="text-right p-3 font-bold text-foreground">ОБЩО ЗА ПЛАЩАНЕ:</td>
                                    <td className="text-right p-3 font-bold text-lg">{(sale.total || 0).toFixed(2)} лв.</td>
                                </tr>
                            </tfoot>
                        </table>
                    </section>

                    <section className="mt-20 grid grid-cols-2 gap-8 text-center">
                        <div>
                            <p className="text-sm text-muted-foreground">Издал:</p>
                            <p className="text-sm mt-1">(Подпис и печат)</p>
                            <p className="mt-8">/СНЦ "Бадминтон клуб Гълъбово"/</p>
                        </div>
                        <div>
                             <p className="text-sm text-muted-foreground">Получил:</p>
                             <p className="text-sm mt-1">(Подпис)</p>
                             <p className="mt-8">/{member ? `${member.firstName} ${member.lastName}` : '................................'}/</p>
                        </div>
                    </section>

                    <footer className="mt-12 pt-6 border-t border-border text-center text-xs text-muted-foreground">
                        <p>Настоящият документ се издава в два еднообразни екземпляра - по един за всяка от страните.</p>
                         {isDeferred 
                            ? <p>Това е проформа документ, който не удостоверява плащане. Той служи за целите на бъдещо плащане.</p>
                            : <p>Този документ удостоверява извършено плащане и служи като касова бележка.</p>}
                    </footer>
                </div>
            </div>

            {/* Email Dialog */}
            <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Изпращане на разписка по имейл</DialogTitle>
                        <DialogDescription>
                            Въведете имейл адреса на получателя.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">
                                Имейл
                            </Label>
                            <Input
                                id="email"
                                value={emailToSend}
                                onChange={(e) => setEmailToSend(e.target.value)}
                                className="col-span-3"
                                placeholder="name@example.com"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">Отказ</Button>
                        </DialogClose>
                        <Button type="submit" onClick={handleSendEmail} disabled={isSendingEmail}>
                            {isSendingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Изпрати
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Потвърждение за изтриване</AlertDialogTitle>
                        <AlertDialogDescription>
                            Сигурни ли сте, че искате да изтриете тази продажба? Това действие е необратимо.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отказ</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Изтрий</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default SaleReceiptPage;
