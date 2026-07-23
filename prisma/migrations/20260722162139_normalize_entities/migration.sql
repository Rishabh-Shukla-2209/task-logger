-- CreateExtension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('EMPLOYEE', 'MANAGER', 'COORDINATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "SupplierType" AS ENUM ('REPAIR_VENDOR', 'PARTS_SUPPLIER', 'BOTH');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('LOGGED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TaskAssignmentStatus" AS ENUM ('PENDING', 'COMPLETED', 'APPROVED');

-- CreateEnum
CREATE TYPE "QueryType" AS ENUM ('NEW_SALE', 'RENT', 'SALE_REPAIR', 'RENT_REPAIR', 'SALE_REPLACEMENT', 'RENT_REPLACEMENT', 'GENERAL_REPAIR');

-- CreateEnum
CREATE TYPE "QueryStatus" AS ENUM ('RECORDED', 'CONFIRMED', 'MATERIAL_OUT', 'ASSIGNED', 'QC_CHECKED', 'CLEANED', 'CROSS_CHECKED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('RECORDED', 'APPROVED_TO_PROCEED', 'VISIT', 'PRICE_RECEIVED', 'DRAFT', 'FINAL_APPROVAL', 'SENT');

-- CreateEnum
CREATE TYPE "WarrantyStatus" AS ENUM ('ADDED', 'WARRANTY_CLAIMED');

-- CreateEnum
CREATE TYPE "InternalRepairStatus" AS ENUM ('RECORDED', 'CONFIRMED', 'SENT_FOR_REPAIR', 'RECEIVED_BACK', 'QC_CHECKED', 'READY', 'SCRAPPED');

-- CreateEnum
CREATE TYPE "PartRequestStatus" AS ENUM ('RECORDED', 'PRICING_RECEIVED', 'APPROVED_BY_BOSS', 'ORDERED', 'RECEIVED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deactivated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "log_date" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "time_taken_minutes" INTEGER,
    "remark" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'LOGGED',
    "manager_edit" TEXT,
    "edited_by_id" TEXT,
    "edited_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskAssignment" (
    "id" TEXT NOT NULL,
    "assigned_by_id" TEXT NOT NULL,
    "assigned_to_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "due_date" DATE,
    "status" "TaskAssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "address" TEXT,
    "type" "SupplierType" NOT NULL DEFAULT 'BOTH',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceQuery" (
    "id" TEXT NOT NULL,
    "query_type" "QueryType" NOT NULL,
    "status" "QueryStatus" NOT NULL DEFAULT 'RECORDED',
    "customer_id" TEXT NOT NULL,
    "device_details" TEXT,
    "replacement_reason" TEXT,
    "replaced_with" TEXT,
    "replacement_approved_by_id" TEXT,
    "confirmed_by_id" TEXT,
    "assigned_to_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueryEvent" (
    "id" TEXT NOT NULL,
    "query_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "remark" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QueryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" TEXT,
    "status" "QuotationStatus" NOT NULL DEFAULT 'RECORDED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationEvent" (
    "id" TEXT NOT NULL,
    "quotation_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "remark" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarrantyExchange" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "device_details" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "exchange_with" TEXT,
    "status" "WarrantyStatus" NOT NULL DEFAULT 'ADDED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarrantyExchange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarrantyExchangeEvent" (
    "id" TEXT NOT NULL,
    "warranty_exchange_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "remark" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WarrantyExchangeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalRepair" (
    "id" TEXT NOT NULL,
    "item_description" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "sent_date" DATE NOT NULL,
    "received_date" DATE,
    "status" "InternalRepairStatus" NOT NULL DEFAULT 'RECORDED',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternalRepair_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalRepairEvent" (
    "id" TEXT NOT NULL,
    "internal_repair_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "remark" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalRepairEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartRequest" (
    "id" TEXT NOT NULL,
    "part_name" TEXT NOT NULL,
    "for_whom" TEXT NOT NULL,
    "supplier_id" TEXT,
    "requested_by_id" TEXT NOT NULL,
    "pricing_received_at" TIMESTAMP(3),
    "approved_by_boss_at" TIMESTAMP(3),
    "status" "PartRequestStatus" NOT NULL DEFAULT 'RECORDED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartRequestEvent" (
    "id" TEXT NOT NULL,
    "part_request_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "remark" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartRequestEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_edited_by_id_fkey" FOREIGN KEY ("edited_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceQuery" ADD CONSTRAINT "ServiceQuery_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceQuery" ADD CONSTRAINT "ServiceQuery_replacement_approved_by_id_fkey" FOREIGN KEY ("replacement_approved_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceQuery" ADD CONSTRAINT "ServiceQuery_confirmed_by_id_fkey" FOREIGN KEY ("confirmed_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceQuery" ADD CONSTRAINT "ServiceQuery_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueryEvent" ADD CONSTRAINT "QueryEvent_query_id_fkey" FOREIGN KEY ("query_id") REFERENCES "ServiceQuery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueryEvent" ADD CONSTRAINT "QueryEvent_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationEvent" ADD CONSTRAINT "QuotationEvent_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationEvent" ADD CONSTRAINT "QuotationEvent_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyExchange" ADD CONSTRAINT "WarrantyExchange_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyExchangeEvent" ADD CONSTRAINT "WarrantyExchangeEvent_warranty_exchange_id_fkey" FOREIGN KEY ("warranty_exchange_id") REFERENCES "WarrantyExchange"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyExchangeEvent" ADD CONSTRAINT "WarrantyExchangeEvent_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalRepair" ADD CONSTRAINT "InternalRepair_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalRepairEvent" ADD CONSTRAINT "InternalRepairEvent_internal_repair_id_fkey" FOREIGN KEY ("internal_repair_id") REFERENCES "InternalRepair"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalRepairEvent" ADD CONSTRAINT "InternalRepairEvent_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartRequest" ADD CONSTRAINT "PartRequest_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartRequest" ADD CONSTRAINT "PartRequest_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartRequestEvent" ADD CONSTRAINT "PartRequestEvent_part_request_id_fkey" FOREIGN KEY ("part_request_id") REFERENCES "PartRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartRequestEvent" ADD CONSTRAINT "PartRequestEvent_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add GIN indices for pg_trgm fuzzy search
CREATE INDEX "Customer_name_trgm_idx" ON "Customer" USING GIN ("name" gin_trgm_ops);
CREATE INDEX "Supplier_name_trgm_idx" ON "Supplier" USING GIN ("name" gin_trgm_ops);
