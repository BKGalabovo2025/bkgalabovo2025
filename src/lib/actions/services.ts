
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ClubService } from '@/lib/definitions';
import { promises as fs } from 'fs';
import path from 'path';

// Път до нашия временен "база данни" файл
const dataFilePath = path.join(process.cwd(), 'src', 'lib', 'data', 'services.json');

// --- Функции за работа с файла --- //
async function readServices(): Promise<ClubService[]> {
  try {
    const fileContent = await fs.readFile(dataFilePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    return [];
  }
}

async function writeServices(services: ClubService[]): Promise<void> {
  await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
  await fs.writeFile(dataFilePath, JSON.stringify(services, null, 2), 'utf8');
}
// --- Край на функциите за работа с файла --- //


export async function createService(formData: FormData) {
  
  const serviceType = formData.get('type') as 'Абонамент' | 'Еднократно плащане';
  const grantsLicense = formData.get('grantsLicense') === 'on';
  const grantsApparel = formData.get('grantsApparel') === 'on';
  const licenseCondition = formData.get('licenseCondition') as 'Веднага' | 'След N плащания';
  const apparelCondition = formData.get('apparelCondition') as 'Веднага' | 'След N плащания';

  const newService: ClubService = {
    id: `svc_${Date.now()}`,
    name: formData.get('name') as string,
    description: formData.get('description') as string || undefined,
    price: Math.round(parseFloat(formData.get('price') as string) * 100),
    currency: 'EUR',
    targetGroups: formData.getAll('targetGroups') as ('Деца' | 'Любители')[],
    type: serviceType,
    minMembers: 1, // TODO: Add fields for this in the form

    // Полета, специфични за услугата
    isCoachLed: false, // Да приемем, че по подразбиране не са водени от треньор. Ще трябва да го добавим във формата.
    requiresBooking: true, // Повечето услуги за любители го изискват

    // --- Абонаментни полета --- //
    billingPeriod: serviceType === 'Абонамент' ? formData.get('billingPeriod') as 'Месечен' | 'Годишен' : undefined,
    
    grantsLicense: grantsLicense,
    licenseCondition: grantsLicense ? licenseCondition : undefined,
    licensePaymentCount: grantsLicense && licenseCondition === 'След N плащания' 
      ? parseInt(formData.get('licensePaymentCount') as string) 
      : undefined,

    grantsApparel: grantsApparel,
    apparelCondition: grantsApparel ? apparelCondition : undefined,
    apparelPaymentCount: grantsApparel && apparelCondition === 'След N плащания'
      ? parseInt(formData.get('apparelPaymentCount') as string)
      : undefined,

    // --- Полета за еднократно плащане --- //
    durationMinutes: serviceType === 'Еднократно плащане' 
      ? parseInt(formData.get('durationMinutes') as string) 
      : undefined,
  };

  const services = await readServices();
  services.push(newService);
  await writeServices(services);

  // Опресняваме кеша и пренасочваме
  revalidatePath('/finances/services');
  redirect('/finances/services');
}
