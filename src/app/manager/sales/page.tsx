import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { TransactionList } from "@/components/accountant/TransactionList"

export default async function SalesPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "MANAGER") redirect("/")

  const transactions = await prisma.transaction.findMany({
    where: { type: "SALE" },
    include: {
      customer: true,
      supplier: true,
    },
    orderBy: { created_at: "desc" }
  })

  return (
    <TransactionList 
      transactions={transactions} 
      type="SALE" 
      title="Sales" 
      description="Manage customer sales and payments." 
      basePath="/manager"
    />
  )
}
