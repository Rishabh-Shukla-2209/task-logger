import prisma from "@/lib/prisma"
import { AuditableWorkflow } from "@/components/shared/AuditableWorkflow"
import { transitionInternalRepair, addInternalRepairRemark } from "@/actions/repairs"
import { Button, buttonVariants } from "@/components/ui/button"
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
  const repair = await prisma.internalRepair.findUnique({
    where: { id: id },
    include: {
      InternalRepairEvents: {
        include: { user: { select: { username: true } } },
        orderBy: { created_at: "asc" }
      },
      supplier: true,
    }
  })

  if (!repair) redirect(basePath)

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href={basePath} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Repairs
          </Link>
        <h2 className="text-3xl font-bold tracking-tight">Repair Ticket</h2>
      </div>

      <div className="bg-card p-6 rounded-lg border shadow-sm grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <p className="text-sm text-muted-foreground">Item Description</p>
          <p className="font-semibold">{repair.item_description}</p>
        </div>
        <div className="md:col-span-2">
          <p className="text-sm text-muted-foreground">Supplier / Vendor</p>
          <p className="font-semibold">{repair.supplier?.name}</p>
        </div>
      </div>

      <AuditableWorkflow
        currentStage={repair.status}
        stages={REPAIR_STAGES}
        events={repair.InternalRepairEvents}
        isFinal={repair.status === "READY" || repair.status === "SCRAPPED" || repair.status === "DROPPED"}
        readOnly={isReadOnly}
        onTransition={async (newStage, remark) => {
          "use server"
          await transitionInternalRepair(repair.id, newStage, remark)
        }}
        onAddRemark={async (remark) => {
          "use server"
          await addInternalRepairRemark(repair.id, remark)
        }}
      />
    </div>
  )
}
