import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { ManagerTaskList } from "@/components/ManagerTaskList"

export default async function ManagerPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "MANAGER") {
    redirect("/")
  }

  const tasks = await prisma.task.findMany({
    include: { user: true },
    orderBy: { created_at: "desc" },
  })

  // Serialize dates for client component
  const serializedTasks = tasks.map((t) => ({
    ...t,
    log_date: t.log_date,
    created_at: t.created_at,
    edited_at: t.edited_at,
    updated_at: t.updated_at,
  }))

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Employee Logs</h2>
        <p className="text-muted-foreground">Review, edit, and approve daily logs from all employees.</p>
      </div>

      <ManagerTaskList tasks={serializedTasks} />
    </div>
  )
}
