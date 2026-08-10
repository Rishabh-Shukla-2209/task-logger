import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { TransactionsTable } from "@/components/accountant/TransactionsTable"

import { getDefaultDateRange } from "@/lib/dateUtils"
import { SingleAnalysis } from "@/components/director/SingleAnalysis"

export default async function ReturnsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
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

  const where: any = { type: "RETURN" };
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
      LineItems: {
        include: { supplier: true }
      }
    },
    orderBy: { created_at: "desc" }
  })

  return (
    <TransactionsTable 
      transactions={transactions} 
      type="RETURN" 
      title="Returns" 
      description="Manage sales, purchase, and rent returns."
      basePath="/director"
      startDate={start}
      endDate={end}
      analysisComponent={<SingleAnalysis type="RETURN" />}
    />
  )
}
