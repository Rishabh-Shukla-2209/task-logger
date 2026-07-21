import { ManagerDashboard } from "./ManagerDashboard"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"

export default async function ManagerPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "MANAGER") {
    redirect("/")
  }

  const tasks = await prisma.task.findMany({
    include: { user: true },
    orderBy: { created_at: "desc" },
  })

  const serialized = tasks.map((t) => ({
    id: t.id,
    description: t.description,
    time_taken: t.time_taken,
    remark: t.remark,
    status: t.status,
    manager_edit: t.manager_edit,
    log_date: t.log_date.toISOString(),
    created_at: t.created_at.toISOString(),
    username: t.user.username,
  }))

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Employee Logs</h2>
        <p className="text-muted-foreground">Review, edit, and approve daily logs from all employees.</p>
      </div>

      <ManagerDashboard tasks={serialized} />
    </div>
  )
}
