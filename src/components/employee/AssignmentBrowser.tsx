"use client"

import { useState, useEffect, useCallback } from "react"
import { TaskStatus } from "@prisma/client"
import { fetchAssignments } from "@/actions/assignments"
import { handleError } from "@/lib/errorHandler"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Loader2, CheckCircle, Clock } from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { completeAssignedTask } from "@/actions/tasks"

export function AssignmentBrowser({ userId = "self" }: { userId?: string }) {
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  const [status, setStatus] = useState<TaskStatus | "PENDING_ONLY" | "ALL">("ALL")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [appliedStartDate, setAppliedStartDate] = useState<Date | undefined>(undefined)
  const [appliedEndDate, setAppliedEndDate] = useState<Date | undefined>(undefined)

  const [completingId, setCompletingId] = useState<string | null>(null)

  const loadAssignments = useCallback(async (currentPage: number) => {
    setLoading(true)
    try {
      const res = await fetchAssignments({
        userId,
        status,
        startDate: appliedStartDate,
        endDate: appliedEndDate,
        page: currentPage,
        limit: 10,
      })
      
      setAssignments(res.data)
      setTotalPages(res.pagination.totalPages || 1)
      setPage(res.pagination.page)
    } catch (err) {
      handleError(err, "Failed to load assignments")
    } finally {
      setLoading(false)
    }
  }, [userId, status, appliedStartDate, appliedEndDate])

  useEffect(() => {
    loadAssignments(1)
  }, [status, appliedStartDate, appliedEndDate])

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

  const handleClearDates = () => {
    setStartDate(undefined)
    setEndDate(undefined)
    setAppliedStartDate(undefined)
    setAppliedEndDate(undefined)
  }

  const handleComplete = async (id: string) => {
    setCompletingId(id)
    try {
      await completeAssignedTask(id)
      toast.success("Assignment marked as completed!")
      loadAssignments(page)
    } catch (error) {
      handleError(error)
    } finally {
      setCompletingId(null)
    }
  }

  const getStatusColor = (s: string) => {
    switch(s) {
      case "PENDING": return "bg-yellow-100 text-yellow-800"
      case "LOGGED": return "bg-blue-100 text-blue-800"
      case "APPROVED": return "bg-green-100 text-green-800"
      case "REJECTED": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-card p-4 rounded-lg shadow-sm border">
        
        <div className="flex gap-2 w-full md:w-auto items-center">
          <Select value={status} onValueChange={(val: any) => setStatus(val)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PENDING_ONLY">Pending Only</SelectItem>
              <SelectItem value="LOGGED">Completed (Logged)</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 w-full md:w-auto items-center">
          <Popover>
            <PopoverTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full md:w-auto text-left font-normal cursor-pointer">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "PPP") : <span>Start due date</span>}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full md:w-auto text-left font-normal cursor-pointer">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, "PPP") : <span>End due date</span>}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
            </PopoverContent>
          </Popover>
          
          {(startDate || endDate) && (
            <Button variant="ghost" onClick={handleClearDates} className="cursor-pointer">Clear</Button>
          )}
          <Button onClick={handleFilter} disabled={!startDate && !endDate} className="cursor-pointer">Go</Button>
        </div>
      </div>

      <div className="space-y-4 relative min-h-[200px]">
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {assignments.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground">No assignments found matching criteria.</div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map((assignment) => (
            <Card key={assignment.id} className="relative group overflow-hidden border">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-medium text-indigo-700 bg-indigo-100 px-2 py-1 rounded">
                    Assigned by {assignment.assigned_by?.username}
                  </span>
                  {assignment.due_date && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(assignment.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                
                <p className="text-sm font-medium whitespace-pre-wrap mt-2 pr-8 mb-4">
                  {assignment.description}
                </p>
                
                <div className="flex items-center justify-between border-t pt-4">
                  <Badge variant="outline" className={getStatusColor(assignment.status)}>
                    {assignment.status === "LOGGED" ? "COMPLETED" : assignment.status}
                  </Badge>

                  {assignment.status === "PENDING" && (
                    <Button 
                      size="sm" 
                      onClick={() => handleComplete(assignment.id)}
                      disabled={completingId === assignment.id}
                      className="cursor-pointer"
                    >
                      {completingId === assignment.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      Mark as Done
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button 
            variant="outline" 
            disabled={page === 1} 
            onClick={() => loadAssignments(page - 1)}
            className="cursor-pointer"
          >
            Previous
          </Button>
          <div className="flex items-center px-4">
            Page {page} of {totalPages}
          </div>
          <Button 
            variant="outline" 
            disabled={page === totalPages} 
            onClick={() => loadAssignments(page + 1)}
            className="cursor-pointer"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
