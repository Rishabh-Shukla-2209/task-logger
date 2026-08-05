import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { TransactionForm } from "@/components/accountant/TransactionForm"

export default async function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  
  if (!session || !["ACCOUNTANT", "MANAGER"].includes(session.user.role)) {
    redirect("/")
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      LineItems: true
    }
  })

  if (!transaction) {
    return <div className="text-center py-20">Transaction not found.</div>
  }

  const customers = await prisma.customer.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
  const suppliers = await prisma.supplier.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
  const employees = await prisma.user.findMany({ select: { id: true, username: true }, orderBy: { username: "asc" } })

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Edit Transaction</h1>
      <TransactionForm 
        defaultType={transaction.type}
        customers={customers}
        suppliers={suppliers}
        employees={employees}
        transaction={transaction}
        readOnlyCore={session.user.role === "ACCOUNTANT" && transaction.type !== "SALE"}
      />
    </div>
  )
}
