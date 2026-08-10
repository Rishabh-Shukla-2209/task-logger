import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { TransactionsTable } from "@/components/accountant/TransactionsTable"
import { SingleAnalysis } from "@/components/director/SingleAnalysis"

import { getDefaultDateRange } from "@/lib/dateUtils"

export default async function SalesPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
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

  const where: any = { type: "SALE" };
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
    include: {
      customer: true,
      supplier: true,
    },
    orderBy: { created_at: "desc" }
  })

  return (
    <TransactionsTable 
      transactions={transactions} 
      type="SALE" 
      title="Sales" 
      description="View customer sales." 
      basePath="/director"
      analysisComponent={<SingleAnalysis type="SALE"
    />}
    />
  )
}
