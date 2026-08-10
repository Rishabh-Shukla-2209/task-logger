import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmployeeTaskForm } from "@/components/TaskForm"
import { startOfDay, endOfDay } from "date-fns"

export default async function ManagerTasksPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "MANAGER") {
    redirect("/")
  }

  const today = new Date()

  // Fetch manager's tasks for today
  const todaysTasks = await prisma.task.findMany({
    where: { 
      user_id: session.user.id,
      created_at: {
        gte: startOfDay(today),
        lte: endOfDay(today)
      }
    },
    orderBy: { created_at: "desc" },
  })

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">My Tasks</h2>
        <p className="text-muted-foreground">Log your tasks for today. (Manager tasks are automatically approved).</p>
      </div>

      <EmployeeTaskForm />

      <div className="space-y-4">
        <h3 className="text-xl font-bold">Today's Tasks</h3>
        {todaysTasks.length === 0 ? (
          <p className="text-muted-foreground">No tasks logged today.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {todaysTasks.map((task) => (
              <Card key={task.id} className="relative group">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm text-muted-foreground">
                      {task.log_date ? new Date(task.log_date).toLocaleDateString() : '-'}
                    </span>
                    <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
                      {task.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium whitespace-pre-wrap mt-2">{task.description}</p>
                  
                  <div className="text-sm text-muted-foreground space-y-1 mt-4">
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
