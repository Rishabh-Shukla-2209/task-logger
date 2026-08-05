import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmployeeTaskForm } from "@/components/TaskForm"
import { EmployeeEditTaskDialog } from "@/components/employee/EmployeeEditTaskDialog"
import { AssignedTasks } from "@/components/employee/AssignedTasks"
import { ClipboardList, PhoneCall } from "lucide-react"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/")
  }

  // Awaiting approval
  const loggedTasks = await prisma.task.findMany({
    where: {
      user_id: session.user.id,
      status: "LOGGED"
    },
    orderBy: { created_at: "desc" },
  })

  // Pending Manager Assignments
  const pendingAssignments = await prisma.taskAssignment.findMany({
    where: {
      assigned_to_id: session.user.id,
      status: "PENDING"
    },
    include: {
      assigned_by: {
        select: { username: true }
      }
    },
    orderBy: { created_at: "desc" }
  })

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
          <p className="text-muted-foreground">Manage your work log and administrative duties.</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex flex-col md:flex-row gap-3 md:gap-6">
            <Link href="/admin/followups" className={buttonVariants({ variant: "outline", className: "justify-start h-12 gap-3" })}>
              <ClipboardList className="h-5 w-5 text-blue-600" />
              <span className="text-lg">Manage Payment Followups</span>
            </Link>
            <Link href="/admin/calling" className={buttonVariants({ variant: "outline", className: "justify-start h-12 gap-3" })}>
              <PhoneCall className="h-5 w-5 text-green-600" />
              <span className="text-lg">Client Calling</span>
            </Link>
          </CardContent>
        </Card>

        <EmployeeTaskForm />
      </div>

      <AssignedTasks assignments={pendingAssignments} />

      <div className="space-y-4">
        <h3 className="text-xl font-bold">My Logged Tasks (Awaiting Approval)</h3>
        {loggedTasks.length === 0 ? (
          <p className="text-muted-foreground">No tasks awaiting approval.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loggedTasks.map((task) => (
              <Card key={task.id} className="relative group">
                <CardContent className="pt-6">
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <EmployeeEditTaskDialog task={task} />
                  </div>

                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm text-muted-foreground">
                      {new Date(task.log_date).toLocaleDateString()}
                    </span>
                    <Badge variant="secondary">
                      {task.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium whitespace-pre-wrap mt-2 pr-8">{task.description}</p>

                  <div className="text-sm text-muted-foreground space-y-1 mb-4">
                    {task.time_taken_minutes && <p><strong>Time:</strong> {task.time_taken_minutes} mins</p>}
                    {task.remark && <p><strong>Remark:</strong> {task.remark}</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
