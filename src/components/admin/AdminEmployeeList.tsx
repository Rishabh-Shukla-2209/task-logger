"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User } from "lucide-react"
import { TaskHistoryBrowser } from "@/components/shared/TaskHistoryBrowser"

export function AdminEmployeeList({ employees }: { employees: { id: string; username: string }[] }) {
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)

  if (selectedEmployee) {
    const emp = employees.find(e => e.id === selectedEmployee)
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
          <Button variant="outline" size="sm" onClick={() => setSelectedEmployee(null)}>
            ← Back to List
          </Button>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-500" />
            {emp?.username}&apos;s Task History
          </h3>
        </div>
        <TaskHistoryBrowser userId={selectedEmployee} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Employees ({employees.length})</h3>
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {employees.map(emp => (
          <Card 
            key={emp.id} 
            className="cursor-pointer hover:shadow-md transition-shadow hover:border-indigo-300"
            onClick={() => setSelectedEmployee(emp.id)}
          >
            <CardContent className="pt-6 flex flex-col items-center justify-center text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl">
                {emp.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-semibold text-lg">{emp.username}</h4>
                <p className="text-sm text-muted-foreground">View History</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
