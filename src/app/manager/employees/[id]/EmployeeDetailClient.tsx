"use client"

import { useState } from "react"
import { approveTask, approveAssignment, editTaskByManager } from "@/actions/tasks"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Edit, Check, X, Loader2, User, History, RotateCcw, ArrowLeft } from "lucide-react"
import { TaskHistoryBrowser } from "@/components/shared/TaskHistoryBrowser"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface SerializedTask {
  id: string
  description: string
  time_taken_minutes: number | null
  remark: string | null
  status: string
  manager_edit: string | null
  log_date: string
}

interface SerializedAssignment {
  id: string
  description: string
  status: string
  due_date: string | null
}

interface EmployeeWithTasks {
  id: string
  username: string
  loggedTasks: SerializedTask[]
  completedAssignments: SerializedAssignment[]
}

export function EmployeeDetailClient({ employee: initialEmployee }: { employee: EmployeeWithTasks }) {
  const router = useRouter()
  const [employee, setEmployee] = useState(initialEmployee)
  const [editingTask, setEditingTask] = useState<SerializedTask | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [editLoading, setEditLoading] = useState(false)

  const handleApprove = async (id: string, approved: boolean, isAssignment = false) => {
    setLoadingId(id)
    try {
      if (isAssignment) {
        await approveAssignment(id, approved)
      } else {
        await approveTask(id, approved)
      }
      
      setEmployee(prev => {
        if (isAssignment) {
          return {
            ...prev,
            completedAssignments: prev.completedAssignments.filter(a => a.id !== id)
          }
        } else {
          return {
            ...prev,
            loggedTasks: prev.loggedTasks.filter(t => t.id !== id)
          }
        }
      })
      router.refresh()
    } finally {
      setLoadingId(null)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingTask) return
    setEditLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      await editTaskByManager(editingTask.id, formData)
      
      const editValue = formData.get("manager_edit") as string
      setEmployee(prev => ({
        ...prev,
        loggedTasks: prev.loggedTasks.map(t => t.id === editingTask.id ? { ...t, manager_edit: editValue } : t)
      }))
      setEditingTask(null)
      router.refresh()
    } finally {
      setEditLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/manager/employees">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Employees
            </Button>
          </Link>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-500" />
            {employee.username}&apos;s Profile
          </h3>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-2 md:grid-cols-2 lg:inline-flex">
          <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" /> History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="mt-6 space-y-8">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Logged Tasks ({employee.loggedTasks.length})</h4>
            {employee.loggedTasks.length === 0 ? (
              <p className="text-muted-foreground">No tasks awaiting approval.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {employee.loggedTasks.map(task => (
                  <Card key={task.id} className="relative group flex flex-col h-full">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{new Date(task.log_date).toLocaleDateString()}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-100"
                            onClick={() => handleApprove(task.id, true)}
                            disabled={loadingId === task.id}
                          >
                            {loadingId === task.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-100"
                            onClick={() => handleApprove(task.id, false)}
                            disabled={loadingId === task.id}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <p className="text-sm font-medium whitespace-pre-wrap">{task.description}</p>
                      
                      {task.manager_edit && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800">
                          <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Your Edit:</p>
                          <p className="text-sm whitespace-pre-wrap">{task.manager_edit}</p>
                        </div>
                      )}
                      
                      <div className="mt-auto pt-4 flex justify-between items-end">
                        <div className="text-xs text-muted-foreground space-y-1">
                          {task.time_taken_minutes && <div><strong>Time:</strong> {task.time_taken_minutes} mins</div>}
                          {task.remark && <div><strong>Remark:</strong> {task.remark}</div>}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setEditingTask(task)}
                        >
                          <Edit className="w-3 h-3 mr-1" /> Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-lg font-semibold">Completed Assignments ({employee.completedAssignments.length})</h4>
            {employee.completedAssignments.length === 0 ? (
              <p className="text-muted-foreground">No assignments awaiting approval.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {employee.completedAssignments.map(assignment => (
                  <Card key={assignment.id} className="border-indigo-200 bg-indigo-50/30">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="border-indigo-300 text-indigo-700">COMPLETED</Badge>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-100"
                            onClick={() => handleApprove(assignment.id, true, true)}
                            disabled={loadingId === assignment.id}
                          >
                            {loadingId === assignment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-amber-600 hover:text-amber-700 hover:bg-amber-100"
                            title="Reject (Return to Pending)"
                            onClick={() => handleApprove(assignment.id, false, true)}
                            disabled={loadingId === assignment.id}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm font-medium whitespace-pre-wrap">{assignment.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="history" className="mt-6">
          <TaskHistoryBrowser userId={employee.id} />
        </TabsContent>
      </Tabs>

      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add / Edit Manager Note</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Original Description (Read-Only)</label>
              <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                {editingTask?.description}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Edited Version</label>
              <Textarea
                name="manager_edit"
                defaultValue={editingTask?.manager_edit || editingTask?.description}
                rows={5}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={editLoading}>
              {editLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Edit
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
