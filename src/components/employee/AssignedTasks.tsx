"use client"

import { useState } from "react"
import { completeAssignedTask } from "@/actions/tasks"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle } from "lucide-react"

export function AssignedTasks({ assignments }: { assignments: any[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleComplete = async (id: string) => {
    setLoadingId(id)
    try {
      await completeAssignedTask(id)
    } finally {
      setLoadingId(null)
    }
  }

  if (assignments.length === 0) return null

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-indigo-500" />
        Manager Assigned Tasks
      </h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assignments.map((assignment) => (
          <Card key={assignment.id} className="border-indigo-200 bg-indigo-50/50">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-medium text-indigo-700 bg-indigo-100 px-2 py-1 rounded">
                  Assigned by {assignment.assigned_by.username}
                </span>
                {assignment.due_date && (
                  <span className="text-xs text-muted-foreground">
                    Due: {new Date(assignment.due_date).toLocaleDateString("en-GB")}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium whitespace-pre-wrap mt-2">{assignment.description}</p>
              
              <div className="mt-4 pt-4 border-t border-indigo-100 flex justify-end">
                <Button 
                  size="sm" 
                  className="bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => handleComplete(assignment.id)}
                  disabled={loadingId === assignment.id}
                >
                  {loadingId === assignment.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Mark as Completed
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
