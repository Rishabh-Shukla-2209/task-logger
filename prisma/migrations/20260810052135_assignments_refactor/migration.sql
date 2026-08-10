/*
  Warnings:

  - You are about to drop the `TaskAssignment` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `user_id` to the `Customer` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentFollowupStatus" AS ENUM ('ACTIVE', 'RESOLVED');

-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('DID_NOT_ANSWER', 'INVALID_CONTACT', 'SWITCHED_OFF', 'SOLD', 'FOLLOW_UP', 'DO_NOT_CALL', 'DIFFERENT_REQUIREMENT', 'PRICING_ISSUE', 'QTY_INSUFFICIENT', 'NO_REQUIREMENT_RIGHT_NOW');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('SALE', 'PURCHASE', 'REPLACEMENT', 'REPAIR', 'RENT', 'RETURN');

-- CreateEnum
CREATE TYPE "ReturnType" AS ENUM ('SALE', 'RENT', 'PURCHASE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'PARTIAL', 'PENDING');

-- CreateEnum
CREATE TYPE "LineItemType" AS ENUM ('SERIALIZED', 'BULK', 'BUNDLE');

-- AlterEnum
ALTER TYPE "InternalRepairStatus" ADD VALUE 'DROPPED';

-- AlterEnum
ALTER TYPE "PartRequestStatus" ADD VALUE 'DROPPED';

-- AlterEnum
ALTER TYPE "QueryStatus" ADD VALUE 'DROPPED';

-- AlterEnum
ALTER TYPE "QuotationStatus" ADD VALUE 'DROPPED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'DIRECTOR';
ALTER TYPE "Role" ADD VALUE 'ACCOUNTANT';
ALTER TYPE "Role" ADD VALUE 'SUPERUSER';
ALTER TYPE "Role" ADD VALUE 'SALES';

-- AlterEnum
ALTER TYPE "TaskStatus" ADD VALUE 'PENDING';

-- AlterEnum
ALTER TYPE "WarrantyStatus" ADD VALUE 'DROPPED';

-- DropForeignKey
ALTER TABLE "TaskAssignment" DROP CONSTRAINT "TaskAssignment_assigned_by_id_fkey";

-- DropForeignKey
ALTER TABLE "TaskAssignment" DROP CONSTRAINT "TaskAssignment_assigned_to_id_fkey";

-- DropIndex
DROP INDEX "Customer_name_trgm_idx";

-- DropIndex
DROP INDEX "Supplier_name_trgm_idx";

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "assigned_by_id" TEXT,
ADD COLUMN     "due_date" DATE,
ALTER COLUMN "log_date" DROP NOT NULL;

-- DropTable
DROP TABLE "TaskAssignment";

-- DropEnum
DROP TYPE "TaskAssignmentStatus";

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "customer_id" TEXT,
    "supplier_id" TEXT,
    "salesperson_id" TEXT,
    "accountant_id" TEXT NOT NULL,
    "total_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount_paid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pending_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "payment_account" TEXT,
    "remark" TEXT,
    "rent_start_date" TIMESTAMP(3),
    "return_type" "ReturnType",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineItem" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "type" "LineItemType" NOT NULL,
    "supplier_id" TEXT,
    "category" TEXT,
    "item_model" TEXT,
    "serial_numbers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "quantity" INTEGER,
    "bundle_name" TEXT,
    "bundle_components" JSONB,
    "make" TEXT,
    "processor" TEXT,
    "generation" TEXT,
    "ram_gb" INTEGER,
    "ssd_gb" INTEGER,
    "hdd_gb" INTEGER,
    "graphic_card" TEXT,
    "desktop_type" TEXT,
    "screen_size" TEXT,
    "ram_type" TEXT,
    "storage_type" TEXT,
    "peripheral_item" TEXT,
    "mis_numbers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "defect" TEXT,
    "replacement_reason" TEXT,
    "replaced_with" TEXT,
    "price_per_unit" DOUBLE PRECISION,
    "total_price" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionAudit" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "edited_by_id" TEXT NOT NULL,
    "previous_state" JSONB NOT NULL,
    "remark" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentFollowup" (
    "id" TEXT NOT NULL,
    "client_name" TEXT NOT NULL,
    "pending_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "PaymentFollowupStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentFollowup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentFollowupEvent" (
    "id" TEXT NOT NULL,
    "followup_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "amount_change" DOUBLE PRECISION,
    "previous_amount" DOUBLE PRECISION,
    "remark" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentFollowupEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallContact" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "location" TEXT,
    "customer_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallLog" (
    "id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "CallStatus" NOT NULL,
    "remark" TEXT,
    "requirement" TEXT,
    "price_given" DOUBLE PRECISION,
    "price_asked" DOUBLE PRECISION,
    "qty" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_salesperson_id_fkey" FOREIGN KEY ("salesperson_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_accountant_id_fkey" FOREIGN KEY ("accountant_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineItem" ADD CONSTRAINT "LineItem_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineItem" ADD CONSTRAINT "LineItem_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionAudit" ADD CONSTRAINT "TransactionAudit_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionAudit" ADD CONSTRAINT "TransactionAudit_edited_by_id_fkey" FOREIGN KEY ("edited_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentFollowupEvent" ADD CONSTRAINT "PaymentFollowupEvent_followup_id_fkey" FOREIGN KEY ("followup_id") REFERENCES "PaymentFollowup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentFollowupEvent" ADD CONSTRAINT "PaymentFollowupEvent_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallContact" ADD CONSTRAINT "CallContact_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallContact" ADD CONSTRAINT "CallContact_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "CallContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
