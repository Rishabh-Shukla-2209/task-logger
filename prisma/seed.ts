import 'dotenv/config';
import prisma from '../src/lib/prisma';
import { 
  Role, TaskStatus, TaskAssignmentStatus, QueryType, QueryStatus, 
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
  await prisma.taskAssignment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding Users...');

  const defaultPassword = await bcrypt.hash('password', 10);
  const rishabhPassword = await bcrypt.hash('rishabh123', 10);

  const superuser = await prisma.user.create({
    data: {
      username: 'Rishabh',
      password: rishabhPassword,
      role: Role.SUPERUSER,
    },
  });

  const admin = await prisma.user.create({
    data: {
      username: 'rajesh_admin',
      password: defaultPassword,
      role: Role.DIRECTOR,
    },
  });

  const accountant = await prisma.user.create({
    data: {
      username: 'sneha_accountant',
      password: defaultPassword,
      role: Role.ACCOUNTANT,
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      username: 'office_admin',
      password: defaultPassword,
      role: Role.ADMIN,
    },
  });

  const coordinator = await prisma.user.create({
    data: {
      username: 'vikram_coordinator',
      password: defaultPassword,
      role: Role.COORDINATOR,
    },
  });

  const manager = await prisma.user.create({
    data: {
      username: 'ananya_manager',
      password: defaultPassword,
      role: Role.MANAGER,
    },
  });

  const emp1 = await prisma.user.create({
    data: {
      username: 'aarav_sharma',
      password: defaultPassword,
      role: Role.EMPLOYEE,
    },
  });

  const salesperson1 = await prisma.user.create({
    data: {
      username: 'rahul_sales',
      password: defaultPassword,
      role: Role.MANAGER, // assuming sales can be manager or employee
    },
  });

  console.log('Users created successfully.');

  console.log('Seeding Customers and Suppliers...');
  const customer1 = await prisma.customer.create({ data: { name: 'Infosys BPO (Electronic City)', address: 'Bangalore', user_id: salesperson1.id } });
  const customer2 = await prisma.customer.create({ data: { name: 'Zomato HQ Gurgaon', address: 'Gurgaon', user_id: salesperson1.id } });
  const customer3 = await prisma.customer.create({ data: { name: 'Apollo Hospitals South Delhi', address: 'New Delhi', user_id: emp1.id } });
  const customer4 = await prisma.customer.create({ data: { name: 'Tech Startup X', address: 'Mumbai', user_id: emp1.id } });

  const supplier1 = await prisma.supplier.create({ data: { name: 'Shree Ram Chip Level Repairs', type: SupplierType.REPAIR_VENDOR, address: 'Nehru Place Micro Repair Hub' } });
  const supplier2 = await prisma.supplier.create({ data: { name: 'Prime ABGB', type: SupplierType.PARTS_SUPPLIER } });
  const supplier3 = await prisma.supplier.create({ data: { name: 'Dell Authorized Distributor', type: SupplierType.BOTH } });
  const supplier4 = await prisma.supplier.create({ data: { name: 'Lenovo Wholesale India', type: SupplierType.BOTH } });

  const daysAgo = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  };

  // ─── MODULE C: ACCOUNTING / TRANSACTIONS ───
  console.log('Seeding Transactions...');

  // 1. SALE Transaction
  await prisma.transaction.create({
    data: {
      type: TransactionType.SALE,
      customer_id: customer1.id,
      salesperson_id: salesperson1.id,
      accountant_id: accountant.id,
      total_value: 125000,
      amount_paid: 100000,
      pending_amount: 25000,
      payment_status: PaymentStatus.PARTIAL,
      payment_account: 'HDFC Bank CC',
      created_at: daysAgo(5),
      LineItems: {
        create: [
          {
            type: LineItemType.SERIALIZED,
            category: 'Laptop',
            make: 'Dell',
            item_model: 'Latitude 7420',
            processor: 'i7',
            generation: '11th Gen',
            ram_gb: 16,
            ssd_gb: 512,
            serial_numbers: ['DL-7420-111', 'DL-7420-112', 'DL-7420-113'],
            supplier_id: supplier3.id,
            price_per_unit: 40000,
            total_price: 120000,
          },
          {
            type: LineItemType.BULK,
            category: 'Accessories',
            make: 'Logitech',
            item_model: 'MK240 Wireless Combo',
            quantity: 5,
            price_per_unit: 1000,
            total_price: 5000,
            supplier_id: supplier2.id,
          }
        ]
      }
    }
  });

  // 2. SALE Transaction (Fully Paid)
  await prisma.transaction.create({
    data: {
      type: TransactionType.SALE,
      customer_id: customer2.id,
      salesperson_id: superuser.id,
      accountant_id: accountant.id,
      total_value: 60000,
      amount_paid: 60000,
      pending_amount: 0,
      payment_status: PaymentStatus.PAID,
      payment_account: 'ICICI Current Account',
      created_at: daysAgo(2),
      LineItems: {
        create: [
          {
            type: LineItemType.SERIALIZED,
            category: 'Laptop',
            make: 'Lenovo',
            item_model: 'ThinkPad X1',
            processor: 'i5',
            generation: '12th Gen',
            ram_gb: 16,
            ssd_gb: 256,
            serial_numbers: ['LN-X1-999'],
            supplier_id: supplier4.id,
            price_per_unit: 60000,
            total_price: 60000,
          }
        ]
      }
    }
  });

  // 3. RENT Transaction
  await prisma.transaction.create({
    data: {
      type: TransactionType.RENT,
      customer_id: customer3.id,
      accountant_id: accountant.id,
      total_value: 15000, // Monthly rental value
      amount_paid: 15000,
      pending_amount: 0,
      payment_status: PaymentStatus.PAID,
      payment_account: 'Cash',
      rent_start_date: daysAgo(10),
      created_at: daysAgo(10),
      LineItems: {
        create: [
          {
            type: LineItemType.SERIALIZED,
            category: 'Desktop',
            make: 'HP',
            item_model: 'EliteDesk 800',
            processor: 'i5',
            generation: '9th Gen',
            ram_gb: 8,
            ssd_gb: 256,
            serial_numbers: ['HP-ED-001', 'HP-ED-002', 'HP-ED-003', 'HP-ED-004', 'HP-ED-005'],
            price_per_unit: 3000,
            total_price: 15000,
          }
        ]
      }
    }
  });

  // 4. RETURN Transaction (Sale Return)
  await prisma.transaction.create({
    data: {
      type: TransactionType.RETURN,
      return_type: ReturnType.SALE,
      customer_id: customer1.id,
      accountant_id: accountant.id,
      total_value: -40000, // Negative value for returns
      amount_paid: 0,
      pending_amount: 0,
      payment_status: PaymentStatus.PAID,
      remark: 'Returned 1 defective Dell Latitude',
      created_at: daysAgo(1),
      LineItems: {
        create: [
          {
            type: LineItemType.SERIALIZED,
            category: 'Laptop',
            make: 'Dell',
            item_model: 'Latitude 7420',
            processor: 'i7',
            serial_numbers: ['DL-7420-113'],
            price_per_unit: -40000,
            total_price: -40000,
          }
        ]
      }
    }
  });

  // 5. PURCHASE Transaction
  await prisma.transaction.create({
    data: {
      type: TransactionType.PURCHASE,
      supplier_id: supplier4.id,
      accountant_id: accountant.id,
      total_value: 200000,
      amount_paid: 100000,
      pending_amount: 100000,
      payment_status: PaymentStatus.PARTIAL,
      payment_account: 'HDFC CC',
      created_at: daysAgo(20),
      LineItems: {
        create: [
          {
            type: LineItemType.SERIALIZED,
            category: 'Laptop',
            make: 'Lenovo',
            item_model: 'ThinkPad E14',
            processor: 'i5',
            generation: '11th Gen',
            ram_gb: 8,
            ssd_gb: 512,
            serial_numbers: ['LN-E14-1', 'LN-E14-2', 'LN-E14-3', 'LN-E14-4', 'LN-E14-5'],
            price_per_unit: 40000,
            total_price: 200000,
          }
        ]
      }
    }
  });

  // ─── MODULE A: TASKS & ASSIGNMENTS ───
  console.log('Seeding Tasks...');

  await prisma.task.create({
    data: {
      user_id: emp1.id,
      log_date: daysAgo(0),
      description: 'Replaced SMPS and tested 450W power supply unit at Infosys BPO site.',
      time_taken_minutes: 150,
      remark: 'Client signed job sheet. All desktop units powered up fine.',
      status: TaskStatus.LOGGED,
    },
  });

  // ─── MODULE B: SERVICE DESK ───
  console.log('Seeding Service Queries (Module B)...');

  await prisma.serviceQuery.create({
    data: {
      query_type: QueryType.NEW_SALE,
      status: QueryStatus.RESOLVED,
      customer_id: customer1.id,
      device_details: '3x Dell Latitude 7420 + 5x Logitech Combos',
      QueryEvents: {
        create: [
          {
            user_id: coordinator.id,
            action: 'Created as RECORDED (NEW_SALE)',
            remark: 'Purchase order received.',
            created_at: daysAgo(7),
          },
          {
            user_id: coordinator.id,
            action: 'Transitioned to RESOLVED',
            remark: 'Installation completed.',
            created_at: daysAgo(5),
          },
        ],
      },
    },
  });

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
