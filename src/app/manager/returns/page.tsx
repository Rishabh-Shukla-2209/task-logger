import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { TransactionsTable } from "@/components/accountant/TransactionsTable"

export default async function ReturnsPage({ searchParams }: { searchParams: Promise<{ start?: string; end?: string }> }) {
  const resolvedParams = await searchParams || {};
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "MANAGER") redirect("/")

  let start = resolvedParams?.start;
  let end = resolvedParams?.end;
  if (!start && !end) {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    start = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
    end = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }

  const where: any = { type: "RETURN", };
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
      type="RETURN" 
      title="Returns" 
      description="Manage sales, purchase, and rent returns."
      basePath="/manager"
      startDate={start}
      endDate={end}
    />
  )
}
