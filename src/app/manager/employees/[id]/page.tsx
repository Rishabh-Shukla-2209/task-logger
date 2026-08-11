import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { EmployeeDetailClient } from "./EmployeeDetailClient"

export default async function ManagerEmployeeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "MANAGER") redirect("/")

  const employee = await prisma.user.findUnique({
    where: { id: id, role: { notIn: ["MANAGER", "DIRECTOR", "SUPERUSER"] } },
  })

  if (!employee) redirect("/manager/employees")

  const loggedTasks = await prisma.task.findMany({
    where: { user_id: employee.id, status: "LOGGED" },
    orderBy: { created_at: "desc" }
  })

  const employeeData = {
    id: employee.id,
    username: employee.username,
    loggedTasks: loggedTasks.map(t => ({
      id: t.id,
      description: t.description,
      time_taken_minutes: t.time_taken_minutes,
      remark: t.remark,
      status: t.status,
      manager_edit: t.manager_edit,
      log_date: t.log_date?.toISOString() || new Date().toISOString(),
      is_assignment: t.assigned_by_id !== null,
    }))
  }

  return (
    <div className="max-w-7xl mx-auto">
      <EmployeeDetailClient employee={employeeData} />
    </div>
  )
}
