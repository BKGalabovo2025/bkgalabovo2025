
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { Reminder } from '@/types';

interface RemindersCardProps {
    reminders: Reminder[];
    isLoading: boolean;
}

export const RemindersCard = ({ reminders, isLoading }: RemindersCardProps) => {

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Bell />Напомняния</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (reminders.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Bell />Напомняния</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Няма активни напомняния.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-yellow-500">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600"><Bell />Напомняния</CardTitle>
                <CardDescription>Важни събития, които изискват вашето внимание.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {reminders.map((reminder, index) => {
                        const memberId = reminder.memberId || reminder.memberId;
                        return (
                            <div key={index} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                <div>
                                    <Link href={`/members/${memberId}`} className="font-semibold text-primary hover:underline">{reminder.memberName}</Link>
                                    <p className="text-sm text-muted-foreground">{reminder.details}</p>
                                </div>
                                <Link href={`/members/${memberId}`} passHref>
                                    <Button variant="secondary" size="sm">
                                        Преглед <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};
