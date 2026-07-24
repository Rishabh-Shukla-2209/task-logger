import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { TransactionList } from "@/components/accountant/TransactionList"
import { SingleAnalysis } from "@/components/admin/SingleAnalysis"

export default async function RepairsPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") redirect("/")

  const transactions = await prisma.transaction.findMany({
    where: { type: "REPAIR" },
    include: {
      customer: true,
      supplier: true,
    },
    orderBy: { created_at: "desc" }
  })

  return (
    <TransactionList 
      transactions={transactions} 
      type="REPAIR" 
      title="Accounting Repairs" 
      description="View repair financial transactions." 
      basePath="/admin"
      analysisComponent={<SingleAnalysis type="REPAIR" />}
    />
  )
}
