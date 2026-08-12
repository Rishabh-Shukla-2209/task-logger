/*
  Warnings:

  - You are about to drop the column `is_deleted` on the `Transaction` table. All the data in the column will be lost.
  - Made the column `supplier_id` on table `LineItem` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "LineItem" DROP CONSTRAINT "LineItem_supplier_id_fkey";

-- DropIndex
DROP INDEX "Transaction_type_is_deleted_idx";

-- AlterTable
ALTER TABLE "LineItem" ALTER COLUMN "supplier_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "is_deleted";

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- AddForeignKey
ALTER TABLE "LineItem" ADD CONSTRAINT "LineItem_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
