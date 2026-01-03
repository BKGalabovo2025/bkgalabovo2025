export interface Service {
    id: string;
    name: string;
    price: number; 
    currency: 'EUR' | 'BGN';
    type: string;
    billingPeriod?: string;
}
