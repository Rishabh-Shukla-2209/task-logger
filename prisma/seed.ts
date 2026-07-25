import 'dotenv/config';
import prisma from '../src/lib/prisma';
import { Role, TaskStatus, TaskAssignmentStatus, QueryType, QueryStatus, QuotationStatus, WarrantyStatus, InternalRepairStatus, PartRequestStatus, SupplierType } from '@prisma/client';

async function main() {
  console.log('Cleaning existing data...');
  // Clean tables in reverse dependency order
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

  const password = 'password';

  const admin = await prisma.user.create({
    data: {
      username: 'rajesh_admin',
      password,
      role: Role.DIRECTOR,
    },
  });

  await prisma.user.create({
    data: {
      username: 'admin1',
      password,
      role: Role.DIRECTOR,
    },
  });

  const coordinator = await prisma.user.create({
    data: {
      username: 'vikram_coordinator',
      password,
      role: Role.COORDINATOR,
    },
  });

  await prisma.user.create({
    data: {
      username: 'coordinator1',
      password,
      role: Role.COORDINATOR,
    },
  });

  const manager = await prisma.user.create({
    data: {
      username: 'ananya_manager',
      password,
      role: Role.MANAGER,
    },
  });

  await prisma.user.create({
    data: {
      username: 'manager1',
      password,
      role: Role.MANAGER,
    },
  });

  const emp1 = await prisma.user.create({
    data: {
      username: 'aarav_sharma',
      password,
      role: Role.EMPLOYEE,
    },
  });

  const emp2 = await prisma.user.create({
    data: {
      username: 'priya_patel',
      password,
      role: Role.EMPLOYEE,
    },
  });

  const emp3 = await prisma.user.create({
    data: {
      username: 'rohan_verma',
      password,
      role: Role.EMPLOYEE,
    },
  });

  await prisma.user.create({
    data: {
      username: 'employee1',
      password,
      role: Role.EMPLOYEE,
    },
  });

  console.log('Users created successfully.');

  console.log('Seeding Customers and Suppliers...');
  const customer1 = await prisma.customer.create({ data: { name: 'Infosys BPO (Electronic City)', address: 'Bangalore' } });
  const customer2 = await prisma.customer.create({ data: { name: 'Zomato HQ Gurgaon', address: 'Gurgaon' } });
  const customer3 = await prisma.customer.create({ data: { name: 'Apollo Hospitals South Delhi', address: 'New Delhi' } });
  const customer4 = await prisma.customer.create({ data: { name: 'Sharma & Sons Logistics (Okhla)', address: 'Okhla' } });
  const customer5 = await prisma.customer.create({ data: { name: 'Mahindra Logistics (Bhiwandi Hub)', address: 'Bhiwandi' } });
  const customer6 = await prisma.customer.create({ data: { name: 'HDFC Bank (Connaught Place Branch)', address: 'CP, Delhi' } });

  const supplier1 = await prisma.supplier.create({ data: { name: 'Shree Ram Chip Level Repairs', type: SupplierType.REPAIR_VENDOR, address: 'Nehru Place Micro Repair Hub' } });
  const supplier2 = await prisma.supplier.create({ data: { name: 'iFixit Component Level Lab', type: SupplierType.REPAIR_VENDOR, address: 'Lamington Road Tech Labs (Mumbai Branch)' } });
  const supplier3 = await prisma.supplier.create({ data: { name: 'Logitech Authorized Center', type: SupplierType.BOTH } });
  const supplier4 = await prisma.supplier.create({ data: { name: 'Zebra Service Point', type: SupplierType.REPAIR_VENDOR } });
  const supplier5 = await prisma.supplier.create({ data: { name: 'Prime ABGB', type: SupplierType.PARTS_SUPPLIER } });


  const daysAgo = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  };

  // ─── MODULE A: TASKS & ASSIGNMENTS ───
  console.log('Seeding Tasks...');

  await prisma.task.createMany({
    data: [
      {
        user_id: emp1.id,
        log_date: daysAgo(0),
        description: 'Replaced SMPS and tested 450W power supply unit at Reliance Digital Connaught Place site.',
        time_taken_minutes: 150,
        remark: 'Client signed job sheet CP-9082. All desktop units powered up fine.',
        status: TaskStatus.LOGGED,
      },
      {
        user_id: emp1.id,
        log_date: daysAgo(1),
        description: 'Configured Mikrotik Router RB750Gr3 with VLAN separation for Gurgaon branch office.',
        time_taken_minutes: 210,
        remark: 'Bandwidth caps applied per department as instructed by IT Manager.',
        status: TaskStatus.LOGGED,
      },
      {
        user_id: emp1.id,
        log_date: daysAgo(2),
        description: 'Serviced HP LaserJet Pro M404dn printer at Apollo Hospitals Okhla campus.',
        time_taken_minutes: 90,
        remark: 'Paper jam issue resolved. Pickup rollers cleaned.',
        status: TaskStatus.APPROVED,
        manager_edit: 'Approved. Good turnaround time for critical hospital printer.',
        edited_by_id: manager.id,
        edited_at: daysAgo(1),
      },
      {
        user_id: emp1.id,
        log_date: daysAgo(3),
        description: 'Site survey for 16-channel Hikvision CCTV installation at Zomato Warehouse Greater Noida.',
        time_taken_minutes: 300,
        remark: 'Cable route map prepared. Recommended Cat6 outdoor shielded cable.',
        status: TaskStatus.APPROVED,
      },
      {
        user_id: emp1.id,
        log_date: daysAgo(5),
        description: 'Attended network downtime call at Tata Consultancy Services Cyber City floor 4.',
        time_taken_minutes: 240,
        remark: 'Faulty D-Link 24-port switch swapped with standby unit.',
        status: TaskStatus.APPROVED,
      },
    ],
  });

  await prisma.task.createMany({
    data: [
      {
        user_id: emp2.id,
        log_date: daysAgo(0),
        description: 'Installed Tally Prime Multi-User on Windows Server 2022 for MG Road Trading Co.',
        time_taken_minutes: 180,
        remark: 'Database restored from backup and user permissions configured.',
        status: TaskStatus.LOGGED,
      },
      {
        user_id: emp2.id,
        log_date: daysAgo(1),
        description: 'L2 troubleshooting on Windows 11 Blue Screen (BSOD) crashes at Paytm Noida Sec-62 office.',
        time_taken_minutes: 120,
        remark: 'Corrupted Realtek Wi-Fi driver reinstalled. System pass diagnostic test.',
        status: TaskStatus.LOGGED,
      },
      {
        user_id: emp2.id,
        log_date: daysAgo(3),
        description: 'RAM upgrade (8GB to 16GB Corsair DDR4) across 8 workstations at Blue Dart Aerocity HQ.',
        time_taken_minutes: 270,
        remark: 'Dual-channel memory verification completed on all PCs.',
        status: TaskStatus.APPROVED,
        manager_edit: 'Verified against inventory allocation. Clean job.',
        edited_by_id: manager.id,
        edited_at: daysAgo(2),
      },
      {
        user_id: emp2.id,
        log_date: daysAgo(4),
        description: 'Biometric Attendance Machine (ZKTeco K40) setup and IP sync at Swiggy Kitchen Indiranagar.',
        time_taken_minutes: 150,
        remark: 'Staff biometric enrollment trained to shift in-charge.',
        status: TaskStatus.APPROVED,
      },
    ],
  });

  await prisma.task.createMany({
    data: [
      {
        user_id: emp3.id,
        log_date: daysAgo(0),
        description: 'Disassembled 5 Lenovo ThinkCentre PCs for motherboard capacitor replacement in Nehru Place lab.',
        time_taken_minutes: 240,
        remark: 'Sent 3 boards to vendor micro-repair specialist.',
        status: TaskStatus.LOGGED,
      },
      {
        user_id: emp3.id,
        log_date: daysAgo(2),
        description: 'Thermal pasting and fan cleaning for 10 Dell Latitude laptops from Swiggy Tech Hub fleet.',
        time_taken_minutes: 360,
        remark: 'Average CPU stress temp dropped from 92°C to 68°C.',
        status: TaskStatus.APPROVED,
      },
    ],
  });

  await prisma.taskAssignment.createMany({
    data: [
      {
        assigned_by_id: manager.id,
        assigned_to_id: emp1.id,
        description: 'Urgent: Perform full network audit & cable tagging at Flipkart Hub (Bhiwandi).',
        due_date: daysAgo(-2),
        status: TaskAssignmentStatus.PENDING,
      },
      {
        assigned_by_id: manager.id,
        assigned_to_id: emp2.id,
        description: 'Deploy 5 refurbished ThinkPad X1 Carbon laptops with corporate image for new joiners.',
        due_date: daysAgo(0),
        status: TaskAssignmentStatus.COMPLETED,
      },
      {
        assigned_by_id: manager.id,
        assigned_to_id: emp3.id,
        description: 'Inspect spare inventory of NVMe SSDs and DDR4 RAM modules in main stockroom.',
        due_date: daysAgo(1),
        status: TaskAssignmentStatus.APPROVED,
      },
    ],
  });

  console.log('Seeding Service Queries (Module B)...');

  await prisma.serviceQuery.create({
    data: {
      query_type: QueryType.SALE_REPLACEMENT,
      status: QueryStatus.CONFIRMED,
      customer_id: customer1.id,
      device_details: 'Dell PowerEdge R440 Server - SN: DL-88392-IN',
      replacement_reason: 'RAID controller failure under warranty within 30 days of sale.',
      replaced_with: 'Dell PowerEdge R440 (Brand New Unit - SN: DL-99210-IN)',
      confirmed_by_id: coordinator.id,
      QueryEvents: {
        create: [
          {
            user_id: coordinator.id,
            action: 'Created as RECORDED (SALE_REPLACEMENT)',
            remark: 'Customer reported critical boot failure on main application server.',
            created_at: daysAgo(4),
          },
          {
            user_id: coordinator.id,
            action: 'Transitioned from RECORDED to CONFIRMED',
            remark: 'Hardware diagnosis confirmed defect. Replacement unit allocated from stock.',
            created_at: daysAgo(3),
          },
        ],
      },
    },
  });

  await prisma.serviceQuery.create({
    data: {
      query_type: QueryType.RENT_REPAIR,
      status: QueryStatus.QC_CHECKED,
      customer_id: customer2.id,
      device_details: 'HP EliteBook 840 G8 (Rental Fleet #R-402)',
      assigned_to_id: emp1.id,
      QueryEvents: {
        create: [
          {
            user_id: coordinator.id,
            action: 'Created as RECORDED (RENT_REPAIR)',
            remark: 'Display flickering and keyboard backlight non-responsive.',
            created_at: daysAgo(5),
          },
          {
            user_id: coordinator.id,
            action: 'Transitioned from RECORDED to CONFIRMED',
            remark: 'Rental agreement verified active.',
            created_at: daysAgo(4),
          },
          {
            user_id: coordinator.id,
            action: 'Transitioned from CONFIRMED to ASSIGNED',
            remark: 'Assigned to Aarav Sharma for display panel replacement.',
            created_at: daysAgo(3),
          },
          {
            user_id: coordinator.id,
            action: 'Transitioned from ASSIGNED to QC_CHECKED',
            remark: 'New IPS panel fitted. Stress test passed for 2 hours.',
            created_at: daysAgo(1),
          },
        ],
      },
    },
  });

  await prisma.serviceQuery.create({
    data: {
      query_type: QueryType.NEW_SALE,
      status: QueryStatus.RESOLVED,
      customer_id: customer3.id,
      device_details: '10x Lenovo V15 Laptops + 2x Canon LBP226dw Printers',
      QueryEvents: {
        create: [
          {
            user_id: coordinator.id,
            action: 'Created as RECORDED (NEW_SALE)',
            remark: 'Purchase order received PO #AP-2026-9901.',
            created_at: daysAgo(7),
          },
          {
            user_id: coordinator.id,
            action: 'Transitioned from RECORDED to CONFIRMED',
            created_at: daysAgo(6),
          },
          {
            user_id: coordinator.id,
            action: 'Transitioned from CONFIRMED to MATERIAL_OUT',
            remark: 'Dispatched via Blue Dart AWB #BD-8839201.',
            created_at: daysAgo(4),
          },
          {
            user_id: coordinator.id,
            action: 'Transitioned from MATERIAL_OUT to RESOLVED',
            remark: 'Installation completed on-site and delivery receipt signed.',
            created_at: daysAgo(2),
          },
        ],
      },
    },
  });

  await prisma.serviceQuery.create({
    data: {
      query_type: QueryType.GENERAL_REPAIR,
      status: QueryStatus.RECORDED,
      customer_id: customer4.id,
      device_details: 'Epson LQ-310 Dot Matrix Printer',
      QueryEvents: {
        create: [
          {
            user_id: coordinator.id,
            action: 'Created as RECORDED (GENERAL_REPAIR)',
            remark: 'Printhead ribbon gear slipping during invoice printing.',
            created_at: daysAgo(1),
          },
        ],
      },
    },
  });

  console.log('Seeding Quotations...');

  await prisma.quotation.create({
    data: {
      customer_id: customer5.id,
      description: 'Annual Maintenance Contract (AMC) for 45 Desktop PCs, 8 Cisco Switches & 4 NAS Storage Units.',
      amount: '₹4,50,000 + GST',
      status: QuotationStatus.PRICE_RECEIVED,
      QuotationEvents: {
        create: [
          {
            user_id: coordinator.id,
            action: 'Created as RECORDED',
            remark: 'Site evaluation done by Rohan Verma.',
            created_at: daysAgo(6),
          },
          {
            user_id: coordinator.id,
            action: 'Transitioned from RECORDED to VISIT',
            remark: 'On-site technical audit completed.',
            created_at: daysAgo(4),
          },
          {
            user_id: coordinator.id,
            action: 'Transitioned from VISIT to PRICE_RECEIVED',
            remark: 'Vendor spare parts pricing finalized.',
            created_at: daysAgo(2),
          },
        ],
      },
    },
  });

  await prisma.quotation.create({
    data: {
      customer_id: customer6.id,
      description: 'Supply & Installation of 12x 1.5KVA Online UPS with Exide Tubular Batteries.',
      amount: '₹2,85,000',
      status: QuotationStatus.SENT,
      QuotationEvents: {
        create: [
          {
            user_id: coordinator.id,
            action: 'Created as RECORDED',
            created_at: daysAgo(10),
          },
          {
            user_id: coordinator.id,
            action: 'Transitioned to FINAL_APPROVAL',
            remark: 'Approved by Branch Operations Manager.',
            created_at: daysAgo(5),
          },
          {
            user_id: coordinator.id,
            action: 'Transitioned to SENT',
            remark: 'Formal quotation PDF emailed to procurement team.',
            created_at: daysAgo(1),
          },
        ],
      },
    },
  });

  console.log('Seeding Warranty Exchanges...');

  await prisma.warrantyExchange.create({
    data: {
      supplier_id: supplier3.id,
      device_details: 'Logitech MX Master 3S Wireless Mouse (SN: LZ-99301)',
      reason: 'Left click double-clicking issue within 11 months of purchase.',
      exchange_with: 'Logitech MX Master 3S (Replacement Sealed Pack)',
      status: WarrantyStatus.WARRANTY_CLAIMED,
      WarrantyExchangeEvents: {
        create: [
          {
            user_id: coordinator.id,
            action: 'Sent to supplier for claim',
            remark: 'Under 1-year warranty.',
            created_at: daysAgo(2)
          }
        ]
      }
    }
  });
  
  await prisma.warrantyExchange.create({
    data: {
      supplier_id: supplier4.id,
      device_details: 'Zebra ZT230 Barcode Label Printer (SN: ZB-44102)',
      reason: 'Thermal printhead bad pixels under 1-year manufacturer warranty.',
      status: WarrantyStatus.ADDED,
    }
  });

  console.log('Seeding Internal Repairs...');

  await prisma.internalRepair.create({
    data: {
      item_description: 'Lenovo ThinkCentre M720 Tiny System Board (No Power)',
      supplier_id: supplier1.id,
      sent_date: daysAgo(5),
      status: InternalRepairStatus.SENT_FOR_REPAIR,
      notes: '1st time sent for power IC replacement.',
      InternalRepairEvents: {
        create: [
          {
            user_id: coordinator.id,
            action: 'Created as RECORDED',
            remark: 'Motherboard short circuit detected on 19V rail.',
            created_at: daysAgo(6),
          },
          {
            user_id: coordinator.id,
            action: 'Transitioned from RECORDED to SENT_FOR_REPAIR',
            remark: 'Delivered to vendor shop by Rohan Verma. (Attempt #1)',
            created_at: daysAgo(5),
          },
        ],
      },
    },
  });

  await prisma.internalRepair.create({
    data: {
      item_description: 'Apple MacBook Pro M1 16" Logic Board (Liquid Damage)',
      supplier_id: supplier2.id,
      sent_date: daysAgo(12),
      received_date: daysAgo(2),
      status: InternalRepairStatus.QC_CHECKED,
      notes: 'Cleaned, re-balled SMC & replaced corroded caps.',
      InternalRepairEvents: {
        create: [
          {
            user_id: coordinator.id,
            action: 'Created as RECORDED',
            created_at: daysAgo(14),
          },
          {
            user_id: coordinator.id,
            action: 'Transitioned to SENT_FOR_REPAIR',
            remark: 'Dispatched via DTDC courier.',
            created_at: daysAgo(12),
          },
          {
            user_id: coordinator.id,
            action: 'Transitioned to RECEIVED_BACK',
            remark: 'Board received back in lab with test report.',
            created_at: daysAgo(2),
          },
          {
            user_id: coordinator.id,
            action: 'Transitioned to QC_CHECKED',
            remark: 'Full diagnostic pass. Charging and display functioning properly.',
            created_at: daysAgo(1),
          },
        ],
      },
    },
  });

  console.log('Seeding Part Requests...');

  await prisma.partRequest.create({
    data: {
      part_name: 'Crucial 16GB DDR4 3200MHz SODIMM RAM (5 units)',
      for_whom: 'Zomato HQ Laptop Memory Upgrade Project',
      requested_by_id: emp1.id,
      supplier_id: supplier5.id,
      status: PartRequestStatus.APPROVED_BY_BOSS,
      pricing_received_at: daysAgo(3),
      approved_by_boss_at: daysAgo(1),
      PartRequestEvents: {
        create: [
          {
            user_id: emp1.id,
            action: 'Created as RECORDED',
            remark: 'Required to resolve performance complaints on Core i5 laptops.',
            created_at: daysAgo(5),
          },
          {
            user_id: coordinator.id,
            action: 'Transitioned to PRICING_RECEIVED',
            remark: 'Quote received from Prime ABGB: ₹3,200 per unit.',
            created_at: daysAgo(3),
          },
          {
            user_id: admin.id,
            action: 'Transitioned to APPROVED_BY_BOSS',
            remark: 'Approved total amount ₹16,000.',
            created_at: daysAgo(1),
          },
        ],
      },
    },
  });

  await prisma.partRequest.create({
    data: {
      part_name: 'Epson L3150 Printhead Assembly & Waste Ink Pad',
      for_whom: 'Apollo Hospitals Okhla Printer Repair',
      requested_by_id: emp2.id,
      status: PartRequestStatus.RECORDED,
      PartRequestEvents: {
        create: [
          {
            user_id: emp2.id,
            action: 'Created as RECORDED',
            remark: 'Printhead nozzles permanently clogged.',
            created_at: daysAgo(1),
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
