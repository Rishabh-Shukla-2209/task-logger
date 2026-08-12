/*
  Warnings:

  - You are about to drop the column `supplier_id` on the `Transaction` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_supplier_id_fkey";

-- DropIndex
DROP INDEX "Transaction_supplier_id_idx";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "supplier_id";
