"use client"

import { useState } from "react"
import { assignTaskToEmployee } from "@/actions/tasks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Loader2 } from "lucide-react"

export function NewAssignmentDialog({ employees }: { employees: { id: string, username: string }[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      await assignTaskToEmployee(formData)
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="cursor-pointer" />}>
        <Plus className="w-4 h-4 mr-2" /> Assign Task
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Assignment</DialogTitle>
          <DialogDescription>Assign a new task to an employee.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Employee</label>
            <Select name="assigned_to_id" required>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.username}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Task Description</label>
            <Textarea name="description" required placeholder="What needs to be done?" rows={3} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Due Date (optional)</label>
            <Input name="due_date" type="date" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Assign Task
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
