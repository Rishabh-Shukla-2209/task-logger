import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { TransactionsTable } from "@/components/accountant/TransactionsTable"
import { SingleAnalysis } from "@/components/director/SingleAnalysis"

import { getDefaultDateRange } from "@/lib/dateUtils"

export default async function ReplacementsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const params = await searchParams;
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "DIRECTOR") redirect("/")

  let start = params?.start;
  let end = params?.end;
  if (!start && !end) {
    const defaultRange = getDefaultDateRange();
    start = defaultRange.start;
    end = defaultRange.end;
  }

  const where: any = { type: "REPLACEMENT", };
  let startDate, endDate;
  if (start && end) {
    startDate = new Date(`${start}T00:00:00.000Z`);
    endDate = new Date(`${end}T23:59:59.999Z`);
    where.created_at = {
      gte: startDate,
      lte: endDate
    };
  }

  const transactions = await prisma.transaction.findMany({
    where,
        select: {
      id: true,
      type: true,
      created_at: true,
      total_value: true,
      amount_paid: true,
      pending_amount: true,
      payment_status: true,
      payment_account: true,
      remark: true,
      return_type: true,
      rent_start_date: true,
      customer: { select: { id: true, name: true, phone: true } },
      salesperson: { select: { username: true } },
      LineItems: {
        select: {
          id: true,
          type: true,
          category: true,
          item_model: true,
          quantity: true,
          serial_numbers: true,
          price_per_unit: true,
          total_price: true,
          peripheral_item: true,
          defect: true,
          replacement_reason: true,
          replaced_with: true,
          supplier: { select: { name: true } }
        }
      }
    },
    orderBy: { created_at: "desc" }
  })

  return (
    <TransactionsTable 
      transactions={transactions} 
      type="REPLACEMENT" 
      title="Replacements" 
      description="View replacement transactions." 
      basePath="/director"
      analysisComponent={<SingleAnalysis type="REPLACEMENT"
    />}
    />
  )
}
