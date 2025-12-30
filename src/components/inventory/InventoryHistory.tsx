'use client';

import { useEffect, useState } from 'react';
import { getInventoryEvents } from '@/services/inventory-service';
import { InventoryEvent } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const InventoryHistory = () => {
    const [events, setEvents] = useState<InventoryEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true);
                const fetchedEvents = await getInventoryEvents();
                setEvents(fetchedEvents);
            } catch (err) {
                setError("Грешка при зареждане на историята.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const renderEventDetails = (event: InventoryEvent) => {
        switch (event.type) {
            case 'restock':
                return <span className="text-green-600">+{event.quantityChange} бр.</span>;
            case 'price_update':
                return `стара: ${event.oldPrice?.toFixed(2)} EUR -> нова: ${event.newPrice?.toFixed(2)} EUR`;
            case 'sale': // Assuming you might add sales later
                return <span className="text-red-600">{event.quantityChange} бр.</span>;
            case 'correction': // For manual corrections
                 return <span className={event.quantityChange && event.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}>{event.quantityChange} бр.</span>;
            default:
                return '--';
        }
    };

    const getEventTypeLabel = (type: InventoryEvent['type']) => {
        switch (type) {
            case 'restock': return <Badge variant="default">Презареждане</Badge>;
            case 'price_update': return <Badge variant="secondary">Промяна на цена</Badge>;
            case 'sale': return <Badge variant="destructive">Продажба</Badge>;
            case 'correction': return <Badge variant="outline">Корекция</Badge>;
             case 'initial': return <Badge>Първоначално</Badge>;
            default: return <Badge color="gray">{type}</Badge>;
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>История на движенията по инвентара</CardTitle>
            </CardHeader>
            <CardContent>
                {loading && <p>Зареждане на историята...</p>}
                {error && <p className="text-red-500">{error}</p>}
                {!loading && !error && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Дата</TableHead>
                                <TableHead>Артикул</TableHead>
                                <TableHead>Тип</TableHead>
                                <TableHead>Промяна</TableHead>
                                <TableHead>Потребител</TableHead>
                                <TableHead>Бележка</TableHead> 
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {events.map((event) => (
                                <TableRow key={event.id}>
                                    <TableCell>{new Date(event.createdAt).toLocaleString('bg-BG')}</TableCell>
                                    <TableCell>{event.productName}</TableCell>
                                    <TableCell>{getEventTypeLabel(event.type)}</TableCell>
                                    <TableCell>{renderEventDetails(event)}</TableCell>
                                    <TableCell>{event.userName}</TableCell>
                                    <TableCell>{event.notes || '--'}</TableCell> 
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
                 {!loading && events.length === 0 && <p className="text-center text-gray-500 py-4">Няма записани събития.</p>}
            </CardContent>
        </Card>
    );
};

export default InventoryHistory;
