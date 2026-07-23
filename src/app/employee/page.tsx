import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmployeeTaskForm } from "@/components/TaskForm"
import { EmployeeEditTaskDialog } from "@/components/employee/EmployeeEditTaskDialog"
import { AssignedTasks } from "@/components/employee/AssignedTasks"

export default async function EmployeePage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "EMPLOYEE") {
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
      <EmployeeTaskForm />

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
