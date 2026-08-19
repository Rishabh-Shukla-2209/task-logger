import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CallingModule } from "@/components/shared/calling/CallingModule"
import prisma from "@/lib/prisma"

export default async function SalesCallingPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "SALES") {
    redirect("/")
  }

  const employees = await prisma.user.findMany({
    where: {
      role: {
        not: "SUPERUSER"
      }
    },
    select: {
      id: true,
      username: true
    },
    orderBy: {
      username: 'asc'
    }
  });

  return (
    <div className="max-w-7xl mx-auto">
      <CallingModule userId={session.user.id} employees={employees} />
    </div>
  )
}
