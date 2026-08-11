-- CreateEnum
CREATE TYPE "OptionType" AS ENUM ('CATEGORY', 'GENERATION', 'PROCESSOR', 'DESKTOP_TYPE', 'RAM_TYPE', 'STORAGE_TYPE', 'MAKE', 'MODEL');

-- CreateEnum
CREATE TYPE "CategoryFieldGroup" AS ENUM ('COMPUTE', 'COMPUTE_DESKTOP', 'DISPLAY', 'STORAGE_RAM', 'STORAGE_DISK', 'PRINTER', 'PERIPHERAL', 'OTHER');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "location" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "LineItemOption" (
    "id" TEXT NOT NULL,
    "type" "OptionType" NOT NULL,
    "value" TEXT NOT NULL,
    "field_group" "CategoryFieldGroup",
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LineItemOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LineItemOption_type_is_active_idx" ON "LineItemOption"("type", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "LineItemOption_type_value_key" ON "LineItemOption"("type", "value");

-- CreateIndex
CREATE INDEX "CallContact_user_id_idx" ON "CallContact"("user_id");

-- CreateIndex
CREATE INDEX "CallContact_phone_idx" ON "CallContact"("phone");

-- CreateIndex
CREATE INDEX "CallLog_user_id_idx" ON "CallLog"("user_id");

-- CreateIndex
CREATE INDEX "CallLog_contact_id_idx" ON "CallLog"("contact_id");

-- CreateIndex
CREATE INDEX "Customer_user_id_idx" ON "Customer"("user_id");

-- CreateIndex
CREATE INDEX "InternalRepair_supplier_id_idx" ON "InternalRepair"("supplier_id");

-- CreateIndex
CREATE INDEX "InternalRepair_status_idx" ON "InternalRepair"("status");

-- CreateIndex
CREATE INDEX "InternalRepairEvent_internal_repair_id_idx" ON "InternalRepairEvent"("internal_repair_id");

-- CreateIndex
CREATE INDEX "LineItem_transaction_id_idx" ON "LineItem"("transaction_id");

-- CreateIndex
CREATE INDEX "PartRequest_customer_id_idx" ON "PartRequest"("customer_id");

-- CreateIndex
CREATE INDEX "PartRequest_status_idx" ON "PartRequest"("status");

-- CreateIndex
CREATE INDEX "PartRequestEvent_part_request_id_idx" ON "PartRequestEvent"("part_request_id");

-- CreateIndex
CREATE INDEX "PaymentFollowup_status_idx" ON "PaymentFollowup"("status");

-- CreateIndex
CREATE INDEX "PaymentFollowupEvent_followup_id_idx" ON "PaymentFollowupEvent"("followup_id");

-- CreateIndex
CREATE INDEX "QueryEvent_query_id_idx" ON "QueryEvent"("query_id");

-- CreateIndex
CREATE INDEX "Quotation_customer_id_idx" ON "Quotation"("customer_id");

-- CreateIndex
CREATE INDEX "Quotation_status_idx" ON "Quotation"("status");

-- CreateIndex
CREATE INDEX "QuotationEvent_quotation_id_idx" ON "QuotationEvent"("quotation_id");

-- CreateIndex
CREATE INDEX "ServiceQuery_customer_id_idx" ON "ServiceQuery"("customer_id");

-- CreateIndex
CREATE INDEX "ServiceQuery_status_idx" ON "ServiceQuery"("status");

-- CreateIndex
CREATE INDEX "ServiceQuery_query_type_idx" ON "ServiceQuery"("query_type");

-- CreateIndex
CREATE INDEX "Supplier_type_idx" ON "Supplier"("type");

-- CreateIndex
CREATE INDEX "Task_user_id_idx" ON "Task"("user_id");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_log_date_idx" ON "Task"("log_date");

-- CreateIndex
CREATE INDEX "Transaction_type_is_deleted_idx" ON "Transaction"("type", "is_deleted");

-- CreateIndex
CREATE INDEX "Transaction_created_at_idx" ON "Transaction"("created_at");

-- CreateIndex
CREATE INDEX "Transaction_customer_id_idx" ON "Transaction"("customer_id");

-- CreateIndex
CREATE INDEX "Transaction_supplier_id_idx" ON "Transaction"("supplier_id");

-- CreateIndex
CREATE INDEX "TransactionAudit_transaction_id_idx" ON "TransactionAudit"("transaction_id");

-- CreateIndex
CREATE INDEX "WarrantyExchange_supplier_id_idx" ON "WarrantyExchange"("supplier_id");

-- CreateIndex
CREATE INDEX "WarrantyExchange_status_idx" ON "WarrantyExchange"("status");

-- CreateIndex
CREATE INDEX "WarrantyExchangeEvent_warranty_exchange_id_idx" ON "WarrantyExchangeEvent"("warranty_exchange_id");
