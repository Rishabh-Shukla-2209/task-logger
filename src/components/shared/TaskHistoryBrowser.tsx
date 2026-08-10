"use client"

import { TaskStatus } from "@prisma/client"

import { useState, useEffect, useCallback } from "react"
import { handleError } from "@/lib/errorHandler"
import { fetchTaskHistory } from "@/actions/history"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Search, Loader2 } from "lucide-react"
import { format, startOfDay, endOfDay, subDays } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface Task {
  id: string
  description: string
  time_taken_minutes: number | null
  status: string
  remark: string | null
  manager_edit: string | null
  log_date: Date | null
}

interface GroupedTasks {
  date: string
  tasks: Task[]
}

export function TaskHistoryBrowser({ userId = "self", status }: { userId?: string, status?: TaskStatus }) {
  const [groupedTasks, setGroupedTasks] = useState<GroupedTasks[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [appliedStartDate, setAppliedStartDate] = useState<Date | undefined>(undefined)
  const [appliedEndDate, setAppliedEndDate] = useState<Date | undefined>(undefined)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const loadTasks = useCallback(async (isLoadMore = false) => {
    setLoading(true)
    if (!isLoadMore) {
      setGroupedTasks([])
    }
    try {
      const currentOffset = isLoadMore ? offset + 7 : 0
      if (!isLoadMore) {
        setOffset(0)
      } else {
        setOffset(currentOffset)
      }

      let finalStartDate = appliedStartDate
      let finalEndDate = appliedEndDate

      if (!finalStartDate || !finalEndDate) {
        const now = new Date()
        const end = subDays(now, currentOffset)
        const start = subDays(end, 6)
        finalEndDate = endOfDay(end)
        finalStartDate = startOfDay(start)
      } else {
        finalStartDate = startOfDay(finalStartDate)
        finalEndDate = endOfDay(finalEndDate)
      }

      const res = await fetchTaskHistory({
        userId,
        searchQuery: debouncedQuery,
        status,
        startDate: finalStartDate,
        endDate: finalEndDate,
        offset: currentOffset,
        tzOffset: new Date().getTimezoneOffset(),
      })

      if (isLoadMore) {
        setGroupedTasks(prev => {
          // merge dates
          const newMap = new Map<string, Task[]>()
          prev.forEach(g => newMap.set(g.date, [...g.tasks]))
          res.data.forEach(g => {
            if (newMap.has(g.date)) {
              newMap.set(g.date, [...newMap.get(g.date)!, ...g.tasks])
            } else {
              newMap.set(g.date, g.tasks)
            }
          })
          return Array.from(newMap.entries())
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([date, tasks]) => ({ date, tasks }))
        })
      } else {
        setGroupedTasks(res.data as any)
      }
      setHasMore(res.data.length > 0)
    } catch (err) {
      handleError(err, "Failed to load tasks")
    } finally {
      setLoading(false)
    }
  }, [userId, debouncedQuery, status, appliedStartDate, appliedEndDate, offset])

  useEffect(() => {
    loadTasks(false)
  }, [debouncedQuery, appliedStartDate, appliedEndDate])

  const handleFilter = () => {
    if ((startDate && !endDate) || (!startDate && endDate)) {
      toast.error("Please select both start and end dates.")
      return
    }
    if (startDate && endDate && endDate < startDate) {
      toast.error("End date cannot be earlier than start date.")
      return
    }
    setAppliedStartDate(startDate)
    setAppliedEndDate(endDate)
  }

  const handleClear = () => {
    setStartDate(undefined)
    setEndDate(undefined)
    setAppliedStartDate(undefined)
    setAppliedEndDate(undefined)
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case "LOGGED": return "bg-blue-100 text-blue-800"
      case "APPROVED": return "bg-green-100 text-green-800"
      case "REJECTED": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-card p-4 rounded-lg shadow-sm border">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search descriptions..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Popover>
            <PopoverTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full md:w-auto text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "PPP") : <span>Start date</span>}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full md:w-auto text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, "PPP") : <span>End date</span>}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
            </PopoverContent>
          </Popover>
          {(startDate || endDate) && (
            <Button variant="ghost" onClick={handleClear} className="cursor-pointer">Clear</Button>
          )}
          <Button onClick={handleFilter} disabled={!startDate && !endDate} className="cursor-pointer">Go</Button>
        </div>
      </div>

      <div className="space-y-8">
        {groupedTasks.length === 0 && loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        {groupedTasks.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground">No tasks found.</div>
        )}
        
        {groupedTasks.map((group) => (
          <div key={group.date} className="space-y-4">
            <h3 className="font-semibold text-lg text-foreground/80 sticky top-0 bg-background/95 py-2 z-10 backdrop-blur">
              {format(new Date(group.date), "EEEE, MMMM d, yyyy")}
            </h3>
            <div className="grid gap-4">
              {group.tasks.map(task => (
                <Card key={task.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      <div className="p-4 sm:border-r sm:w-1/4 bg-muted/20">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Time Taken</div>
                        <div className="font-semibold">{task.time_taken_minutes ? `${task.time_taken_minutes} mins` : "N/A"}</div>
                        <div className="mt-3">
                          <Badge variant="outline" className={getStatusColor(task.status)}>
                            {task.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-4 sm:w-3/4 flex flex-col justify-between">
                        <div>
                          <p className="whitespace-pre-wrap">{task.description}</p>
                        </div>
                        {task.remark && (
                          <div className="mt-4 p-3 bg-muted text-sm rounded-md border">
                            <strong>Remark:</strong> {task.remark}
                          </div>
                        )}
                        {task.manager_edit && (
                          <div className="mt-4 p-3 bg-blue-50 text-blue-900 text-sm rounded-md border border-blue-100">
                            <strong>Manager Note:</strong> {task.manager_edit}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {hasMore && !startDate && !endDate && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={() => loadTasks(true)} disabled={loading} className="w-full sm:w-auto">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Load Older Tasks
          </Button>
        </div>
      )}
    </div>
  )
}
