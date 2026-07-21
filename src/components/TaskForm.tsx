"use client";

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { addTask } from "@/actions/tasks"
import { Plus, Check, Loader2 } from "lucide-react"

export function EmployeeTaskForm() {
  const [boxes, setBoxes] = useState([1, 2, 3])
  const [loadingIds, setLoadingIds] = useState<number[]>([])
  const [completedIds, setCompletedIds] = useState<number[]>([])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, id: number) => {
    e.preventDefault()
    setLoadingIds((prev) => [...prev, id])

    const formData = new FormData(e.currentTarget)
    try {
      await addTask(formData)
      setCompletedIds((prev) => [...prev, id])
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingIds((prev) => prev.filter((v) => v !== id))
    }
  }

  const addBox = () => {
    setBoxes((prev) => [...prev, Math.max(0, ...prev) + 1])
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Log Today&apos;s Work</h2>
          <p className="text-sm text-muted-foreground">One task per box. Add more boxes if needed.</p>
        </div>
        <Button onClick={addBox} variant="outline" size="sm" className="cursor-pointer">
          <Plus className="w-4 h-4 mr-2" /> Add Task
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {boxes.map((boxId) => {
          const isCompleted = completedIds.includes(boxId)
          const isLoading = loadingIds.includes(boxId)

          if (isCompleted) {
            return (
              <Card key={boxId} className="bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800">
                <CardContent className="pt-6 flex flex-col items-center justify-center h-full text-green-700 dark:text-green-400 min-h-[280px]">
                  <Check className="w-12 h-12 mb-2" />
                  <p className="font-medium">Logged ✓</p>
                </CardContent>
              </Card>
            )
          }

          return (
            <Card key={boxId}>
              <CardHeader>
                <CardTitle className="text-lg">Task #{boxId}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => handleSubmit(e, boxId)} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">What did you do?</label>
                    <Textarea
                      name="description"
                      placeholder="Describe the task..."
                      required
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Time taken</label>
                    <Input
                      name="time_taken"
                      placeholder="e.g., 2 hours"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Remark (optional)</label>
                    <Input
                      name="remark"
                      placeholder="Any extra notes"
                    />
                  </div>
                  <Button type="submit" className="w-full cursor-pointer" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Log Task
                  </Button>
                </form>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
