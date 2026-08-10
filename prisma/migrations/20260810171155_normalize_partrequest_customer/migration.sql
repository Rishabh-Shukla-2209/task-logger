/*
  Warnings:

  - You are about to drop the column `for_whom` on the `PartRequest` table. All the data in the column will be lost.
  - Added the required column `customer_id` to the `PartRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PartRequest" DROP COLUMN "for_whom",
ADD COLUMN     "customer_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "PartRequest" ADD CONSTRAINT "PartRequest_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
