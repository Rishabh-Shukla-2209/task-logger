import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { GlobalProgressDashboard } from "@/components/shared/GlobalProgressDashboard"
import { AdminEmployeeList } from "@/components/admin/AdminEmployeeList"

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") redirect("/")

  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    select: { id: true, username: true },
    orderBy: { username: "asc" }
  })

  return (
    <div className="space-y-12 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground">Read-only overview of all company operations and employee logs.</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold">Global Progress</h3>
        <GlobalProgressDashboard />
      </div>

      <div className="pt-8 border-t">
        <AdminEmployeeList employees={employees} />
      </div>
    </div>
  )
}
