"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { editTaskByEmployee } from "@/actions/tasks"
import { Edit, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function EmployeeEditTaskDialog({ task }: { task: any }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    try {
      const res = await editTaskByEmployee(task.id, formData)
      if (res?.error) {
        toast.error(res.error) // Concurrency failure toast
        setOpen(false)
        return
      }
      toast.success("Task updated successfully")
      setOpen(false)
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 text-muted-foreground">
        <Edit className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Task Description</label>
            <Textarea 
              name="description" 
              defaultValue={task.description} 
              required 
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Time Taken (Optional)</label>
            <Input 
              name="time_taken" 
              defaultValue={task.time_taken || ""} 
              placeholder="e.g. 2 hours"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Remark (Optional)</label>
            <Input 
              name="remark" 
              defaultValue={task.remark || ""} 
              placeholder="Any additional notes"
            />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
