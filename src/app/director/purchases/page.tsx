import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { TransactionList } from "@/components/accountant/TransactionList"
import { SingleAnalysis } from "@/components/director/SingleAnalysis"

export default async function PurchasesPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "DIRECTOR") redirect("/")

  const transactions = await prisma.transaction.findMany({
    where: { type: "PURCHASE" },
    include: {
      customer: true,
      supplier: true,
    },
    orderBy: { created_at: "desc" }
  })

  return (
    <TransactionList 
      transactions={transactions} 
      type="PURCHASE" 
      title="Purchases" 
      description="View vendor purchases." 
      basePath="/director"
      analysisComponent={<SingleAnalysis type="PURCHASE" />}
    />
  )
}
