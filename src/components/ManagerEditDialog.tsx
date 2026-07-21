"use client";

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { editTaskByManager } from "@/actions/tasks"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

interface TaskForEdit {
  id: string
  description: string
  manager_edit: string | null
}

export function ManagerEditDialog({
  task,
  open,
  onOpenChange,
}: {
  task: TaskForEdit
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      await editTaskByManager(task.id, formData)
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            The employee&apos;s original text is preserved. Your edit is saved separately as a manager note.
          </DialogDescription>
        </DialogHeader>
        <div className="mb-4 p-3 bg-muted rounded-md">
          <p className="text-xs font-medium text-muted-foreground mb-1">Original (read-only):</p>
          <p className="text-sm whitespace-pre-wrap">{task.description}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Manager&apos;s Edit</label>
            <Textarea
              name="manager_edit"
              defaultValue={task.manager_edit || task.description}
              required
              rows={5}
            />
          </div>
          <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Edit
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
