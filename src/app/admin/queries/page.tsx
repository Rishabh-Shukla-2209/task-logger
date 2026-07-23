import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const STEP_LABELS: Record<string, string> = {
  RECORDED: "Recorded",
  CONFIRMED: "Confirmed",
  MATERIAL_OUT: "Material Out",
  ASSIGNED: "Assigned",
  QC_CHECKED: "QC Checked",
  CLEANED: "Cleaned",
  CROSS_CHECKED: "Cross Checked",
  RESOLVED: "Resolved",
}

export default async function AdminQueriesPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") redirect("/")

  const queries = await prisma.serviceQuery.findMany({
    orderBy: { created_at: "desc" },
    include: {
      QueryEvents: {
        include: { user: true },
        orderBy: { created_at: "asc" },
      },
      replacement_approved_by: true,
      customer: true,
    },
  })

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Service Queries (Read-Only)</h2>
        <p className="text-muted-foreground">Full visibility into the service desk pipeline.</p>
      </div>

      <div className="space-y-6">
        {queries.map((query) => (
          <Card key={query.id}>
            <CardHeader className="bg-muted/50 border-b pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl">{query.customer?.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {query.device_details || "No device details"} | {new Date(query.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  <Badge variant="secondary">{query.query_type.replace(/_/g, " ")}</Badge>
                  <Badge>{STEP_LABELS[query.status] || query.status}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Replacement info */}
              {(query.query_type === "SALE_REPLACEMENT" || query.query_type === "RENT_REPLACEMENT") && (
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-800">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">Replacement Details</p>
                  <p className="text-sm"><strong>Reason:</strong> {query.replacement_reason || "Not recorded"}</p>
                  <p className="text-sm"><strong>Replaced With:</strong> {query.replaced_with || "Not recorded"}</p>
                  <p className="text-sm"><strong>Approved By:</strong> {query.replacement_approved_by?.username || "Not approved"}</p>
                </div>
              )}

              {/* Audit trail */}
              {query.QueryEvents.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium mb-2">Audit Trail:</p>
                  {query.QueryEvents.map((event) => (
                    <div key={event.id} className="text-sm border-l-2 border-muted pl-3 py-1">
                      <span className="font-medium">{event.action}</span>
                      <span className="text-muted-foreground"> — {event.user.username}, {new Date(event.created_at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No audit events.</p>
              )}
            </CardContent>
          </Card>
        ))}
        {queries.length === 0 && (
          <p className="text-muted-foreground">No queries exist yet.</p>
        )}
      </div>
    </div>
  )
}
