import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, ClipboardList } from "lucide-react"
import Link from "next/link"
import { NewAssignmentDialog } from "./NewAssignmentDialog"

export default async function ManagerEmployeesPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "MANAGER") redirect("/")

  const employees = await prisma.user.findMany({
    where: { role: { in: ["EMPLOYEE", "ACCOUNTANT", "COORDINATOR"] } },
    select: { id: true, username: true, role: true },
    orderBy: { username: "asc" },
  })

  // Fetch pending items for each employee in a single query to prevent DB connection exhaustion
  const taskCounts = await prisma.task.groupBy({
    by: ['user_id'],
    where: {
      user_id: { in: employees.map(e => e.id) },
      status: "LOGGED"
    },
    _count: {
      id: true
    }
  })

  const countMap = new Map(taskCounts.map(tc => [tc.user_id, tc._count.id]))

  const employeesWithTasks = employees.map(emp => ({
    ...emp,
    pendingCount: countMap.get(emp.id) || 0
  }))

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Employees</h2>
          <p className="text-muted-foreground">Manage your team and approve tasks.</p>
        </div>
        <NewAssignmentDialog employees={employees} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {employeesWithTasks.map(emp => (
          <Link href={`/manager/employees/${emp.id}`} key={emp.id}>
            <Card className="cursor-pointer hover:shadow-md transition-all hover:border-indigo-300 h-full">
              <CardContent className="pt-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                    {emp.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">{emp.username}</h4>
                    <p className="text-sm text-muted-foreground">{emp.role}</p>
                  </div>
                </div>
                {emp.pendingCount > 0 && (
                  <Badge variant="default" className="bg-red-500 hover:bg-red-600">
                    {emp.pendingCount} Pending
                  </Badge>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
        {employeesWithTasks.length === 0 && (
          <p className="text-muted-foreground col-span-full">No employees found.</p>
        )}
      </div>
    </div>
  )
}
