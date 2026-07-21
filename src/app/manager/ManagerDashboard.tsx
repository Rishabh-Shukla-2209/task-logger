"use client"

import { useState } from "react"
import { approveTask, editTaskByManager } from "@/actions/tasks"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Edit, Check, X, Loader2 } from "lucide-react"
import { useTransition } from "react";

interface SerializedTask {
  id: string
  description: string
  time_taken: string | null
  remark: string | null
  status: string
  manager_edit: string | null
  log_date: string
  created_at: string
  username: string
}

export function ManagerDashboard({ tasks }: { tasks: SerializedTask[] }) {
  const [editingTask, setEditingTask] = useState<SerializedTask | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [isPending, startTransition] = useTransition();

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingTask) return
    setEditLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      await editTaskByManager(editingTask.id, formData)
      setEditingTask(null)
    } finally {
      setEditLoading(false)
    }
  }

  return (
    <>
      <div className="grid gap-4">
        {tasks.map((task) => (
          <Card key={task.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{task.username}</CardTitle>
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
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="cursor-pointer"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        await approveTask(task.id, true);
                      })
                    }
                  >
                    <Check className="w-4 h-4 mr-1" /> Approve
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="cursor-pointer"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        await approveTask(task.id, false);
                      })
                    }
                  >
                    <X className="w-4 h-4 mr-1" /> Reject
                  </Button>

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

      {/* Edit Dialog */}
      <Dialog open={!!editingTask} onOpenChange={(open) => { if (!open) setEditingTask(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              The employee&apos;s original is preserved. Your edit is saved separately.
            </DialogDescription>
          </DialogHeader>
          {editingTask && (
            <>
              <div className="p-3 bg-muted rounded-md">
                <p className="text-xs font-medium text-muted-foreground mb-1">Original (read-only):</p>
                <p className="text-sm whitespace-pre-wrap">{editingTask.description}</p>
              </div>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Manager&apos;s Edit</label>
                  <Textarea
                    name="manager_edit"
                    defaultValue={editingTask.manager_edit || editingTask.description}
                    required
                    rows={5}
                  />
                </div>
                <Button type="submit" className="w-full cursor-pointer" disabled={editLoading}>
                  {editLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Edit
                </Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
