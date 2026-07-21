import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmployeeTaskForm } from "@/components/TaskForm"

export default async function EmployeePage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "EMPLOYEE") {
    redirect("/")
  }

  const tasks = await prisma.task.findMany({
    where: { user_id: session.user.id },
    orderBy: { created_at: "desc" },
  })

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <EmployeeTaskForm />

      <div className="space-y-4">
        <h3 className="text-xl font-bold">My Logged Tasks</h3>
        {tasks.length === 0 ? (
          <p className="text-muted-foreground">No tasks logged yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm text-muted-foreground">
                      {new Date(task.log_date).toLocaleDateString()}
                    </span>
                    <Badge
                      variant={
                        task.status === "APPROVED"
                          ? "default"
                          : task.status === "REJECTED"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {task.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium whitespace-pre-wrap mt-2">{task.description}</p>
                  {task.manager_edit && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800">
                      <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Manager&apos;s Edit:</p>
                      <p className="text-sm whitespace-pre-wrap">{task.manager_edit}</p>
                    </div>
                  )}
                  <div className="mt-4 pt-3 border-t text-sm text-muted-foreground">
                    {task.time_taken && <p><strong>Time:</strong> {task.time_taken}</p>}
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
