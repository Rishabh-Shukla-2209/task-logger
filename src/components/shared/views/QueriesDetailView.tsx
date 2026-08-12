import prisma from "@/lib/prisma"
import { AuditableWorkflow } from "@/components/shared/AuditableWorkflow"
import { transitionServiceQuery, addServiceQueryRemark, reopenServiceQuery } from "@/actions/queries"
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { redirect } from "next/navigation"
import { updateServiceQuery } from "@/actions/queries"
import { EditQueryDialog } from "@/components/coordinator/EditQueryDialog"

const QUERY_STAGES = [
  "RECORDED",
  "CONFIRMED",
  "MATERIAL_OUT",
  "ASSIGNED",
  "QC_CHECKED",
  "CLEANED",
  "CROSS_CHECKED",
  "RESOLVED",
  "DROPPED"
]

export async function QueriesDetailView({ 
  id, 
  basePath, 
  isReadOnly = false 
}: { 
  id: string, 
  basePath: string, 
  isReadOnly?: boolean 
}) {
  const [query, employees, confirmers] = await Promise.all([
    prisma.serviceQuery.findUnique({
      where: { id: id },
      include: {
        QueryEvents: {
          include: { user: { select: { username: true } } },
          orderBy: { created_at: "asc" }
        },
        customer: true,
        confirmed_by: { select: { username: true } },
        assigned_to: { select: { username: true } },
      }
    }),
    prisma.user.findMany({
      where: { role: "EMPLOYEE", is_active: true },
      select: { id: true, username: true },
      orderBy: { username: "asc" }
    }),
    prisma.user.findMany({
      where: { role: { in: ["COORDINATOR", "MANAGER"] }, is_active: true },
      select: { id: true, username: true },
      orderBy: { username: "asc" }
    })
  ])

  if (!query) redirect(basePath)

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href={basePath} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Queries
          </Link>
        <h2 className="text-3xl font-bold tracking-tight">Query Details: {query.customer?.name}</h2>
        {!isReadOnly && <EditQueryDialog initialData={query} updateAction={updateServiceQuery} />}
      </div>

      <div className="bg-card p-6 rounded-lg border shadow-sm grid md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Type</p>
          <p className="font-semibold">{query.query_type}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Device Details</p>
          <p className="font-semibold">{query.device_details || "N/A"}</p>
        </div>
        {query.replacement_reason && (
          <div className="md:col-span-2">
            <p className="text-sm text-muted-foreground">Replacement Reason</p>
            <p className="font-semibold">{query.replacement_reason}</p>
          </div>
        )}
        {query.replaced_with && (
          <div>
            <p className="text-sm text-muted-foreground">Replaced With</p>
            <p className="font-semibold">{query.replaced_with}</p>
          </div>
        )}
      </div>

      <AuditableWorkflow
        currentStage={query.status}
        stages={QUERY_STAGES}
        events={query.QueryEvents}
        isFinal={query.status === "RESOLVED" || query.status === "DROPPED"}
        reopenStage="CONFIRMED"
        employeesForAssignment={employees}
        managersForConfirmation={confirmers}
        requiresReplacementInfoForConfirm={query.query_type === "SALE_REPLACEMENT" || query.query_type === "RENT_REPLACEMENT"}
        readOnly={isReadOnly}
        onTransition={async (newStage, remark, extraData) => {
          "use server"
          await transitionServiceQuery(query.id, newStage, remark, extraData)
        }}
        onAddRemark={async (remark) => {
          "use server"
          await addServiceQueryRemark(query.id, remark)
        }}
        onReopen={async (remark) => {
          "use server"
          await reopenServiceQuery(query.id, remark)
        }}
      />
    </div>
  )
}
