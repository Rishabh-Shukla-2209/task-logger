import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { TransactionsTable } from "@/components/accountant/TransactionsTable"

export default async function ReturnsPage(props: any) {
  const searchParams = await props.searchParams || {};
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "MANAGER") redirect("/")

  let start = searchParams?.start;
  let end = searchParams?.end;
  if (!start && !end) {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    start = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
    end = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
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
      basePath="/manager"
      startDate={start}
      endDate={end}
    />
  )
}
