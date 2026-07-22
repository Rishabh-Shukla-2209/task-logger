"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowRight, MessageSquare, RotateCcw } from "lucide-react"

export interface WorkflowEvent {
  id: string
  action: string
  remark: string | null
  created_at: Date
  user: {
    username: string
  }
}

interface AuditableWorkflowProps {
  currentStage: string
  stages: string[]
  events: WorkflowEvent[]
  isFinal: boolean
  reopenStage?: string
  employeesForAssignment?: { id: string, username: string }[]
  requiresReplacementInfoForConfirm?: boolean
  onTransition: (newStage: string, remark: string, extraData?: { assignedToId?: string, replacedWith?: string, confirmedById?: string }) => Promise<void>
  onAddRemark: (remark: string) => Promise<void>
  onReopen?: (remark: string) => Promise<void>
  readOnly?: boolean
}

export function AuditableWorkflow({
  currentStage,
  stages,
  events,
  isFinal,
  reopenStage,
  employeesForAssignment,
  requiresReplacementInfoForConfirm,
  onTransition,
  onAddRemark,
  onReopen,
  readOnly
}: AuditableWorkflowProps) {
  const [remark, setRemark] = useState("")
  const [selectedNextStage, setSelectedNextStage] = useState<string>("")
  const [selectedAssignee, setSelectedAssignee] = useState<string>("")
  const [replacedWith, setReplacedWith] = useState<string>("")
  const [confirmedById, setConfirmedById] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const handleTransition = async () => {
    if (!selectedNextStage) return
    
    if (selectedNextStage === "ASSIGNED" && employeesForAssignment && !selectedAssignee) {
      alert("Please select an employee to assign this ticket to.")
      return
    }

    if (selectedNextStage === "CONFIRMED" && requiresReplacementInfoForConfirm) {
      if (!replacedWith || !confirmedById) {
        alert("Please fill in both 'Replaced With' and 'Confirmed By' fields.")
        return
      }
    }

    setLoading(true)
    try {
      await onTransition(selectedNextStage, remark, {
        assignedToId: selectedAssignee || undefined,
        replacedWith: replacedWith || undefined,
        confirmedById: confirmedById || undefined,
      })
      setRemark("")
      setSelectedNextStage("")
      setSelectedAssignee("")
      setReplacedWith("")
      setConfirmedById("")
    } finally {
      setLoading(false)
    }
  }

  const handleAddRemark = async () => {
    if (!remark) return
    setLoading(true)
    try {
      await onAddRemark(remark)
      setRemark("")
    } finally {
      setLoading(false)
    }
  }

  const handleReopen = async () => {
    if (!onReopen || !reopenStage) return
    setLoading(true)
    try {
      await onReopen(remark)
      setRemark("")
    } finally {
      setLoading(false)
    }
  }

  // Find the index of current stage to only allow forward transitions
  const currentIndex = stages.indexOf(currentStage)
  const availableNextStages = currentIndex !== -1 ? stages.slice(currentIndex + 1) : []

  return (
    <div className={`grid grid-cols-1 ${readOnly ? '' : 'md:grid-cols-2'} gap-6`}>
      {!readOnly && (
        <Card className="flex flex-col h-[600px]">
          <CardHeader>
            <CardTitle>Workflow Action</CardTitle>
            <div className="text-sm text-muted-foreground mt-2">
              Current Stage: <Badge variant="secondary" className="text-base py-1 px-3 ml-2">{currentStage}</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between space-y-4">
            
            {!isFinal ? (
              <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Add Remark / Notes</label>
                <Textarea 
                  placeholder="Enter any notes or remarks before transitioning or just to log information..."
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="resize-none h-32"
                />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <Button 
                  onClick={handleAddRemark} 
                  disabled={loading || !remark.trim()} 
                  variant="outline" 
                  className="w-full"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Add Remark Only (Stay in {currentStage})
                </Button>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Transition to Next Stage</label>
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-2">
                      <Select value={selectedNextStage} onValueChange={(v) => { 
                        setSelectedNextStage(v || ""); 
                        setSelectedAssignee("");
                        setReplacedWith("");
                        setConfirmedById("");
                      }}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select next stage" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableNextStages.map(stage => (
                            <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        onClick={handleTransition} 
                        disabled={loading || !selectedNextStage || 
                          (selectedNextStage === "ASSIGNED" && !!employeesForAssignment && !selectedAssignee) ||
                          (selectedNextStage === "CONFIRMED" && !!requiresReplacementInfoForConfirm && (!replacedWith || !confirmedById))
                        }
                      >
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Move
                      </Button>
                    </div>

                    {selectedNextStage === "CONFIRMED" && requiresReplacementInfoForConfirm && (
                      <div className="flex flex-col gap-3 p-3 bg-muted/50 rounded-md border">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Confirmation Details Required</p>
                        <div className="space-y-1">
                          <label className="text-xs font-medium">Replaced With</label>
                          <Input 
                            value={replacedWith} 
                            onChange={e => setReplacedWith(e.target.value)} 
                            placeholder="e.g. Dell PowerEdge R440 (Brand New Unit - SN: XYZ)" 
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium">Confirmed By</label>
                          <Select value={confirmedById} onValueChange={(v) => setConfirmedById(v || "")}>
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="Select coordinator/manager..." />
                            </SelectTrigger>
                            <SelectContent>
                              {employeesForAssignment?.map(emp => (
                                <SelectItem key={emp.id} value={emp.id}>{emp.username}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {selectedNextStage === "ASSIGNED" && employeesForAssignment && (
                      <div className="flex gap-2">
                        <Select value={selectedAssignee} onValueChange={(v) => setSelectedAssignee(v || "")}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select employee to assign to..." />
                          </SelectTrigger>
                          <SelectContent>
                            {employeesForAssignment.map(emp => (
                              <SelectItem key={emp.id} value={emp.id}>{emp.username}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
              <div className="rounded-full bg-green-100 p-6">
                <Badge variant="outline" className="text-xl bg-green-500 text-white border-transparent">
                  RESOLVED / COMPLETED
                </Badge>
              </div>
              <p className="text-muted-foreground">This ticket has reached its final stage.</p>
              
              {onReopen && reopenStage && (
                <div className="w-full space-y-4 pt-8 border-t mt-auto">
                  <Textarea 
                    placeholder="Reason for reopening..."
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    className="resize-none"
                  />
                  <Button 
                    onClick={handleReopen} 
                    disabled={loading || !remark.trim()} 
                    variant="destructive" 
                    className="w-full"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reopen (Return to {reopenStage})
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      )}

      <Card className={`flex flex-col ${readOnly ? '' : 'h-[600px]'}`}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Audit Trail</CardTitle>
          {readOnly && (
            <div className="text-sm text-muted-foreground mt-2">
              Current Stage: <Badge variant="secondary" className="ml-2">{currentStage}</Badge>
            </div>
          )}
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full p-6">
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
              {events.length === 0 ? (
                <div className="text-center text-muted-foreground mt-10">No events recorded yet.</div>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-background bg-muted text-muted-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      {event.action.includes("→") ? <ArrowRight className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card p-4 rounded border shadow-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-sm">{event.user.username}</span>
                        <time className="text-xs text-muted-foreground">{format(new Date(event.created_at), "MMM d, HH:mm")}</time>
                      </div>
                      <div className="text-sm font-medium mb-1">{event.action}</div>
                      {event.remark && (
                        <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded italic mt-2">
                          "{event.remark}"
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
