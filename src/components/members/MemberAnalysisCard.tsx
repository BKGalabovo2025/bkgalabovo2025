'use client';

import { MemberAnalysis, AnalyzedSubscription } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Clock } from "lucide-react";

const getOverallStatusInfo = (status: MemberAnalysis['overallStatus']) => {
    switch (status) {
        case 'OK':
            return { text: 'Всичко е наред', Icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' };
        case 'WARNING':
            return { text: 'Предупреждение', Icon: AlertTriangle, color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
        case 'ACTION_NEEDED':
            return { text: 'Нуждае се от внимание', Icon: AlertTriangle, color: 'text-orange-600', bgColor: 'bg-orange-50' };
        default:
            return { text: 'Неизвестен', Icon: Clock, color: 'text-gray-600', bgColor: 'bg-gray-50' };
    }
};

const getPaymentStatusInfo = (status: AnalyzedSubscription['paymentStatus']) => {
    switch (status) {
        case 'PAID':
            return <Badge variant="success">Платен</Badge>;
        case 'PENDING':
            return <Badge variant="secondary">Чакащ</Badge>;
        case 'OVERDUE':
            return <Badge variant="destructive">Просрочен</Badge>;
        default:
            return <Badge>{status}</Badge>;
    }
};

interface MemberAnalysisCardProps {
    analysis: MemberAnalysis;
}

export const MemberAnalysisCard = ({ analysis }: MemberAnalysisCardProps) => {
    const overallStatus = getOverallStatusInfo(analysis.overallStatus);

    return (
        <Card className={`border-2 ${overallStatus.bgColor}`}>
            <CardHeader>
                <div className="flex items-center space-x-3">
                    <overallStatus.Icon className={`h-8 w-8 ${overallStatus.color}`} />
                    <div>
                        <CardTitle className={`${overallStatus.color}`}>{overallStatus.text}</CardTitle>
                        <CardDescription>Автоматичен анализ към {new Date(analysis.analysisDate).toLocaleString('bg-BG')}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {analysis.analyzedSubscriptions.length > 0 ? (
                    <div className="space-y-4">
                        {analysis.analyzedSubscriptions.map((sub: AnalyzedSubscription) => (
                            <div key={sub.subscriptionId} className="p-3 bg-background rounded-lg border">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-semibold text-md">{sub.serviceName}</h4>
                                    {getPaymentStatusInfo(sub.paymentStatus)}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                    <p>Период:</p>
                                    <p className="text-right font-medium text-foreground">{new Date(sub.startDate).toLocaleDateString('bg-BG')} - {new Date(sub.endDate).toLocaleDateString('bg-BG')}</p>
                                    
                                    <p>Статус на абонамента:</p>
                                    <p className="text-right font-medium text-foreground">{sub.status === 'active' ? 'Активен' : 'Чакащ плащане'}</p>

                                    <p>Посетени тренировки:</p>
                                    <p className="text-right font-medium text-foreground">{sub.attendanceSummary.totalAttended}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-4">
                        <p>Няма активни абонаменти за анализ.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};