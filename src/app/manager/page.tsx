import { ManagerDashboard } from "./ManagerDashboard"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { GlobalProgressDashboard } from "@/components/shared/GlobalProgressDashboard"

export default async function ManagerPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "MANAGER") {
    redirect("/")
  }

  // Fetch all employees
  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    select: { id: true, username: true },
    orderBy: { username: "asc" }
  })

  // Fetch pending items for each employee
  const employeesWithTasks = await Promise.all(employees.map(async (emp) => {
    const loggedTasks = await prisma.task.findMany({
      where: { user_id: emp.id, status: "LOGGED" },
      orderBy: { created_at: "desc" }
    })
    
    const completedAssignments = await prisma.taskAssignment.findMany({
      where: { assigned_to_id: emp.id, status: "COMPLETED" },
      orderBy: { updated_at: "desc" }
    })

    return {
      ...emp,
      loggedTasks: loggedTasks.map(t => ({
        id: t.id,
        description: t.description,
        time_taken: t.time_taken,
        remark: t.remark,
        status: t.status,
        manager_edit: t.manager_edit,
        log_date: t.log_date.toISOString(),
      })),
      completedAssignments: completedAssignments.map(a => ({
        id: a.id,
        description: a.description,
        status: a.status,
        due_date: a.due_date ? a.due_date.toISOString() : null
      }))
    }
  }))

  return (
    <div className="space-y-12 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Manager Overview</h2>
        <p className="text-muted-foreground">Monitor global progress and approve employee work.</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold">Global Progress Dashboard</h3>
        <GlobalProgressDashboard />
      </div>

      <div className="border-t pt-8">
        <ManagerDashboard employees={employeesWithTasks} />
      </div>
    </div>
  )
}
