import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { TransactionForm } from "@/components/accountant/TransactionForm"

export default async function NewTransactionPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type = "SALE" } = await searchParams;
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ACCOUNTANT") redirect("/")

  const { fetchAllOptions } = await import("@/actions/option-actions")
  
  const [customers, suppliers, employees, options] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { role: { not: "SUPERUSER" }, is_active: true },
      orderBy: { username: "asc" }
    }),
    fetchAllOptions()
  ])

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">New Transaction</h2>
        <p className="text-muted-foreground">Record a new {type.toLowerCase()}.</p>
      </div>

      <TransactionForm 
        defaultType={type as any} 
        customers={customers} 
        suppliers={suppliers} 
        employees={employees} 
        options={options}
      />
    </div>
  )
}
