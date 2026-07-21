import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { advanceQueryStep, reopenQuery, updateReplacementDetails } from "@/actions/queries"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRight, RotateCcw } from "lucide-react"

const ALL_STEPS = [
  "RECORDED",
  "CONFIRMED",
  "DISPATCHED",
  "ASSIGNED",
  "RECEIVED",
  "QC_CHECKED",
  "PACKED",
  "RESOLVED",
] as const

const STEP_LABELS: Record<string, string> = {
  RECORDED: "Recorded",
  CONFIRMED: "Confirmed",
  DISPATCHED: "Dispatched",
  ASSIGNED: "Assigned",
  RECEIVED: "Received",
  QC_CHECKED: "QC Checked",
  PACKED: "Packed",
  RESOLVED: "Resolved",
}

export default async function ServiceDeskDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") redirect("/")

  const query = await prisma.serviceQuery.findUnique({
    where: { id: params.id },
    include: {
      QueryEvents: {
        include: { user: true },
        orderBy: { created_at: "asc" },
      },
      replacement_approved_by: true,
    },
  })

  if (!query) redirect("/coordinator")

  const currentStepIndex = ALL_STEPS.indexOf(query.status as typeof ALL_STEPS[number])
  const nextStep = currentStepIndex < ALL_STEPS.length - 1 ? ALL_STEPS[currentStepIndex + 1] : null
  const isReplacement = query.query_type === "SALE_REPLACEMENT" || query.query_type === "RENT_REPLACEMENT"

  const managers = await prisma.user.findMany({
    where: { role: { in: ["MANAGER", "ADMIN"] } },
  })

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{query.customer_name}</h2>
        <p className="text-muted-foreground">
          {query.query_type.replace(/_/g, " ")} | {query.device_details || "No device details"}
        </p>
      </div>

      {/* Step Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {ALL_STEPS.map((step, i) => {
              const isCurrent = i === currentStepIndex
              const isDone = i < currentStepIndex
              return (
                <div key={step} className="flex items-center">
                  <div
                    className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                      isCurrent
                        ? "bg-primary text-primary-foreground"
                        : isDone
                          ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {STEP_LABELS[step]}
                  </div>
                  {i < ALL_STEPS.length - 1 && (
                    <ArrowRight className={`w-4 h-4 mx-1 flex-shrink-0 ${isDone ? "text-green-500" : "text-muted-foreground/40"}`} />
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-6 flex gap-3">
            {nextStep && (
              <form action={async () => {
                "use server"
                await advanceQueryStep(query.id)
              }}>
                <Button type="submit" className="cursor-pointer">
                  <ArrowRight className="w-4 h-4 mr-2" /> Advance to {STEP_LABELS[nextStep]}
                </Button>
              </form>
            )}
            {query.status === "RESOLVED" && (
              <form action={async () => {
                "use server"
                await reopenQuery(query.id)
              }}>
                <Button type="submit" variant="outline" className="cursor-pointer">
                  <RotateCcw className="w-4 h-4 mr-2" /> Reopen
                </Button>
              </form>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Replacement Details */}
      {isReplacement && (
        <Card>
          <CardHeader>
            <CardTitle>Replacement Details</CardTitle>
          </CardHeader>
          <CardContent>
            {query.replacement_reason ? (
              <div className="space-y-2 mb-4">
                <p><strong>Reason:</strong> {query.replacement_reason}</p>
                <p><strong>Replaced With:</strong> {query.replaced_with || "-"}</p>
                <p><strong>Approved By:</strong> {query.replacement_approved_by?.username || "Not yet approved"}</p>
              </div>
            ) : null}
            <form action={async (formData: FormData) => {
              "use server"
              await updateReplacementDetails(query.id, formData)
            }} className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Reason for Replacement</label>
                <Textarea name="replacement_reason" defaultValue={query.replacement_reason || ""} required rows={2} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Replaced With</label>
                <Input name="replaced_with" defaultValue={query.replaced_with || ""} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Approved By</label>
                <Select name="replacement_approved_by_id" defaultValue={query.replacement_approved_by_id || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select approver" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.username} ({m.role})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="cursor-pointer">Save Replacement Details</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Audit Trail */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {query.QueryEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-3 text-sm border-l-2 border-muted pl-4 py-1">
                <div className="flex-1">
                  <p className="font-medium">{event.action}</p>
                  <p className="text-muted-foreground">
                    by <strong>{event.user.username}</strong> on {new Date(event.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {query.QueryEvents.length === 0 && (
              <p className="text-muted-foreground text-sm">No events recorded yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
