import { addMember } from '../src/services/member-service';
import { addSale } from '../src/services/sales-service';
import { createClubService, getAllClubServices } from '../src/services/subscription-service';
import { Member, Sale, SaleItem, ClubService } from '../src/types';

const seedDatabase = async () => {
  console.log('Starting database seed...');

  try {
    // Create a sample service
    await createClubService({
        name: 'Месечна карта',
        description: 'Месечна карта за достъп до залата',
        price: 50,
        currency: 'BGN',
        type: 'Абонамент',
        billingPeriod: 'Месечен',
        targetGroups: ['Любители'],
        isCoachLed: false,
        durationMinutes: 0,
        requiresBooking: false,
        minMembers: 1,
        maxMembers: 0, // unlimited
        specialRights: [],
        cancellationPolicy: {
            isAllowed: false,
            noticePeriodDays: 0,
            feeType: 'none',
            feeValue: 0,
            description: '',
            longTermSicknessDiscount: 0
        }
    } as Omit<ClubService, 'id'>);
    console.log(`Created a sample service.`);

    // Create Members
    const member1Id = await addMember({
      firstName: 'Иван',
      lastName: 'Петров',
      email: 'ivan.petrov@example.com',
      phone: '0888123456',
      dateOfBirth: '1990-05-15',
      registrationDate: new Date().toISOString(),
      status: 'active',
    } as Omit<Member, 'id' | 'name'>);
    console.log(`Created member 1 with ID: ${member1Id}`);

    const member2Id = await addMember({
      firstName: 'Мария',
      lastName: 'Георгиева',
      email: 'maria.georgieva@example.com',
      phone: '0888654321',
      dateOfBirth: '1995-08-20',
      registrationDate: new Date().toISOString(),
      status: 'active',
    } as Omit<Member, 'id' | 'name'>);
    console.log(`Created member 2 with ID: ${member2Id}`);

    // Fetch services to get a valid product
    const services = await getAllClubServices();
    if (services.length === 0) {
      console.error('No services found. Cannot create sales.');
      return;
    }
    const serviceForSale = services[0]; // Use the first available service as a product

    // Create Sales
    const sale1Items: SaleItem[] = [
      { productId: serviceForSale.id, name: serviceForSale.name, quantity: 1, price: serviceForSale.price },
    ];

    await addSale({
      memberId: member1Id,
      date: new Date().toISOString(),
      items: sale1Items,
      status: 'completed',
      currency: 'BGN',
    } as Omit<Sale, 'id'>);
    console.log(`Created sale 1 for member ${member1Id}`);

    const sale2Items: SaleItem[] = [
        { productId: serviceForSale.id, name: serviceForSale.name, quantity: 2, price: serviceForSale.price },
    ];

    await addSale({
        memberId: member2Id,
        date: new Date().toISOString(),
        items: sale2Items,
        status: 'pending',
        currency: 'BGN',
      } as Omit<Sale, 'id'>);
    console.log(`Created sale 2 for member ${member2Id}`);


    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

seedDatabase();
