import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { GlobalProgressDashboard } from "@/components/shared/GlobalProgressDashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { Users } from "lucide-react"

export default async function ManagerPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "MANAGER") {
    redirect("/")
  }

  // Fetch employees
  const employees = await prisma.user.findMany({
    where: { role: { in: ["EMPLOYEE", "ACCOUNTANT", "COORDINATOR"] } },
    select: { id: true, username: true },
    orderBy: { username: "asc" },
  })

  // We need total count, but we only slice 5 for the overview
  const totalEmployees = employees.length
  const topEmployees = employees.slice(0, 5)

  // Fetch pending items for the top 5 employees
  const employeesWithTasks = await Promise.all(topEmployees.map(async (emp) => {
    const loggedTasksCount = await prisma.task.count({
      where: { user_id: emp.id, status: "LOGGED" },
    })
    
    const completedAssignmentsCount = await prisma.taskAssignment.count({
      where: { assigned_to_id: emp.id, status: "COMPLETED" },
    })

    return {
      ...emp,
      pendingCount: loggedTasksCount + completedAssignmentsCount
    }
  }))

  return (
    <div className="space-y-12 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Manager Overview</h2>
        <p className="text-muted-foreground">Monitor global progress and your team.</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold">Global Progress Dashboard</h3>
        <GlobalProgressDashboard basePathPrefix="/manager" />
      </div>

      <div className="border-t pt-8 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            Employees Overview
          </h3>
          {totalEmployees > 5 && (
            <Link href="/manager/employees" className={buttonVariants({ variant: "outline" })}>View All {totalEmployees} Employees</Link>
          )}
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {employeesWithTasks.map(emp => (
            <Link href={`/manager/employees/${emp.id}`} key={emp.id}>
              <Card className="cursor-pointer hover:shadow-md transition-all hover:border-indigo-300">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                      {emp.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">{emp.username}</h4>
                      <p className="text-sm text-muted-foreground">Employee</p>
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
            <p className="text-muted-foreground">No employees found.</p>
          )}
        </div>
        {totalEmployees > 5 && (
          <div className="pt-2">
            <Link href="/manager/employees" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline">
              + {totalEmployees - 5} more employees
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
