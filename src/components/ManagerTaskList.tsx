'use client'

import { useState } from "react"
import { approveTask } from "@/actions/tasks"
import { ManagerEditDialog } from "@/components/ManagerEditDialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit, Check, X } from "lucide-react"

interface TaskWithUser {
  id: string
  description: string
  time_taken: string | null
  remark: string | null
  status: string
  manager_edit: string | null
  log_date: Date
  created_at: Date
  user: { username: string }
}

export function ManagerTaskList({ tasks }: { tasks: TaskWithUser[] }) {
  const [editingTask, setEditingTask] = useState<TaskWithUser | null>(null)

  return (
    <>
      <div className="grid gap-4">
        {tasks.map((task) => (
          <Card key={task.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{task.user.username}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    task.status === "APPROVED" ? "default" :
                    task.status === "REJECTED" ? "destructive" : "secondary"
                  }>
                    {task.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(task.log_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap mb-3 bg-muted p-4 rounded-md text-sm">{task.description}</p>

              {task.manager_edit && (
                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Manager&apos;s Edit:</p>
                  <p className="text-sm whitespace-pre-wrap">{task.manager_edit}</p>
                </div>
              )}

              <div className="text-sm text-muted-foreground mb-4">
                {task.time_taken && <p><strong>Time:</strong> {task.time_taken}</p>}
                {task.remark && <p><strong>Remark:</strong> {task.remark}</p>}
              </div>

              {task.status === "LOGGED" && (
                <div className="flex gap-2">
                  <form action={async () => {
                    "use server"
                    await approveTask(task.id, true)
                  }}>
                    <Button type="submit" variant="default" size="sm" className="cursor-pointer">
                      <Check className="w-4 h-4 mr-1" /> Approve
                    </Button>
                  </form>
                  <form action={async () => {
                    "use server"
                    await approveTask(task.id, false)
                  }}>
                    <Button type="submit" variant="destructive" size="sm" className="cursor-pointer">
                      <X className="w-4 h-4 mr-1" /> Reject
                    </Button>
                  </form>
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => setEditingTask(task)}
                  >
                    <Edit className="w-4 h-4 mr-1" /> Edit
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {tasks.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No tasks to review.
            </CardContent>
          </Card>
        )}
      </div>

      {editingTask && (
        <ManagerEditDialog
          task={editingTask}
          open={!!editingTask}
          onOpenChange={(open) => { if (!open) setEditingTask(null) }}
        />
      )}
    </>
  )
}
