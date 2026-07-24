import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { SalesTable } from "@/components/accountant/SalesTable"
import { SingleAnalysis } from "@/components/admin/SingleAnalysis"

export default async function SalesPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ACCOUNTANT") redirect("/")

  const transactions = await prisma.transaction.findMany({
    where: { type: "SALE" },
    include: {
      customer: true,
      LineItems: {
        include: {
          supplier: true
        }
      }
    },
    orderBy: { created_at: "desc" }
  })

  return (
    <SalesTable 
      transactions={transactions} 
      basePath="/accountant"
      analysisComponent={<SingleAnalysis type="SALE" />}
    />
  )
}
