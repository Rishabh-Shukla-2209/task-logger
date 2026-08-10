import prisma from "@/lib/prisma"
import { AuditableWorkflow } from "@/components/shared/AuditableWorkflow"
import { transitionPartRequest, addPartRequestRemark, reopenPartRequest } from "@/actions/parts"
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { redirect } from "next/navigation"

const PART_STAGES = [
  "RECORDED",
  "PRICING_RECEIVED",
  "APPROVED_BY_BOSS",
  "ORDERED",
  "RECEIVED",
  "DROPPED"
]

export async function PartsDetailView({ 
  id, 
  basePath, 
  isReadOnly = false 
}: { 
  id: string, 
  basePath: string, 
  isReadOnly?: boolean 
}) {
  const req = await prisma.partRequest.findUnique({
    where: { id: id },
    include: {
      PartRequestEvents: {
        include: { user: { select: { username: true } } },
        orderBy: { created_at: "asc" }
      },
      supplier: true,
      customer: true
    }
  })

  if (!req) redirect(basePath)

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href={basePath} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Parts
          </Link>
        <h2 className="text-3xl font-bold tracking-tight">Part Request: {req.part_name}</h2>
      </div>

      <div className="bg-card p-6 rounded-lg border shadow-sm grid md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Customer</p>
          <p className="font-semibold">{req.customer?.name}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Supplier</p>
          <p className="font-semibold">{req.supplier?.name || "Not Assigned"}</p>
        </div>
      </div>

      <AuditableWorkflow
        currentStage={req.status}
        stages={PART_STAGES}
        events={req.PartRequestEvents}
        isFinal={req.status === "RECEIVED" || req.status === "DROPPED"}
        reopenStage="RECORDED"
        readOnly={isReadOnly}
        onTransition={async (newStage, remark) => {
          "use server"
          await transitionPartRequest(req.id, newStage, remark)
        }}
        onAddRemark={async (remark) => {
          "use server"
          await addPartRequestRemark(req.id, remark)
        }}
        onReopen={async (remark) => {
          "use server"
          await reopenPartRequest(req.id, remark)
        }}
      />
    </div>
  )
}
