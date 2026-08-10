import 'dotenv/config';
import prisma from '../src/lib/prisma';
import { 
  Role, TaskStatus, QueryType, QueryStatus, 
  QuotationStatus, WarrantyStatus, InternalRepairStatus, PartRequestStatus, 
  SupplierType, TransactionType, PaymentStatus, LineItemType, ReturnType 
} from '@prisma/client';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Cleaning existing data...');
  // Clean tables in reverse dependency order
  await prisma.transactionAudit.deleteMany();
  await prisma.lineItem.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.paymentFollowupEvent.deleteMany();
  await prisma.paymentFollowup.deleteMany();
  
  await prisma.warrantyExchangeEvent.deleteMany();
  await prisma.queryEvent.deleteMany();
  await prisma.quotationEvent.deleteMany();
  await prisma.internalRepairEvent.deleteMany();
  await prisma.partRequestEvent.deleteMany();
  
  await prisma.serviceQuery.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.warrantyExchange.deleteMany();
  await prisma.internalRepair.deleteMany();
  await prisma.partRequest.deleteMany();
  await prisma.task.deleteMany();
  await prisma.task.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding Users...');

  const rishabhPassword = await bcrypt.hash('Rishabh.Superuser@7863', 10);

  const superuser = await prisma.user.create({
    data: {
      username: 'Rishabh',
      password: rishabhPassword,
      role: Role.SUPERUSER,
    },
  });

  console.log('Superuser created successfully.');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
