import prisma from "@/lib/prisma"
import { AuditableWorkflow } from "@/components/shared/AuditableWorkflow"
import { transitionInternalRepair, addInternalRepairRemark, reopenInternalRepair } from "@/actions/repairs"
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { redirect } from "next/navigation"

const REPAIR_STAGES = [
  "RECORDED",
  "CONFIRMED",
  "SENT_FOR_REPAIR",
  "RECEIVED_BACK",
  "QC_CHECKED",
  "READY",
  "SCRAPPED",
  "DROPPED"
]

export async function RepairsDetailView({ 
  id, 
  basePath, 
  isReadOnly = false 
}: { 
  id: string, 
  basePath: string, 
  isReadOnly?: boolean 
}) {
  const req = await prisma.internalRepair.findUnique({
    where: { id: id },
    include: {
      InternalRepairEvents: {
        include: { user: { select: { username: true } } },
        orderBy: { created_at: "asc" }
      },
      supplier: true,
    }
  })

  if (!req) redirect(basePath)

  const employees = await prisma.user.findMany({
    where: { role: { in: ["EMPLOYEE", "COORDINATOR", "MANAGER"] } },
    select: { id: true, username: true },
    orderBy: { username: "asc" }
  })

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href={basePath} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Repairs
          </Link>
        <h2 className="text-3xl font-bold tracking-tight">Internal Repair</h2>
      </div>

      <div className="bg-card p-6 rounded-lg border shadow-sm grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <p className="text-sm text-muted-foreground">Item Description</p>
          <p className="font-semibold">{req.item_description}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Supplier</p>
          <p className="font-semibold">{req.supplier?.name}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Sent Date</p>
          <p className="font-semibold">{req.sent_date ? new Date(req.sent_date).toLocaleDateString() : "N/A"}</p>
        </div>
      </div>

      <AuditableWorkflow
        currentStage={req.status}
        stages={REPAIR_STAGES}
        events={req.InternalRepairEvents}
        isFinal={req.status === "READY" || req.status === "SCRAPPED" || req.status === "DROPPED"}
        reopenStage="RECORDED"
        employeesForAssignment={employees}
        requiresQCUserAssignment={true}
        readOnly={isReadOnly}
        onTransition={async (newStage, remark, extraData) => {
          "use server"
          await transitionInternalRepair(req.id, newStage, remark, extraData)
        }}
        onAddRemark={async (remark) => {
          "use server"
          await addInternalRepairRemark(req.id, remark)
        }}
        onReopen={async (remark) => {
          "use server"
          await reopenInternalRepair(req.id, remark)
        }}
      />
    </div>
  )
}
