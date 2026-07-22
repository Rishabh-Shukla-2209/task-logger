import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { AuditableWorkflow } from "@/components/shared/AuditableWorkflow"
import { transitionInternalRepair, addInternalRepairRemark } from "@/actions/repairs"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

const REPAIR_STAGES = [
  "RECORDED",
  "CONFIRMED",
  "SENT_FOR_REPAIR",
  "RECEIVED_BACK",
  "QC_CHECKED",
  "READY",
  "SCRAPPED"
]

export default async function RepairDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions)
  if (!session || !["COORDINATOR", "MANAGER", "ADMIN"].includes(session.user.role)) redirect("/")
  
  const isReadOnly = session.user.role !== "COORDINATOR"

  const repair = await prisma.internalRepair.findUnique({
    where: { id: id },
    include: {
      InternalRepairEvents: {
        include: { user: { select: { username: true } } },
        orderBy: { created_at: "asc" }
      },
    }
  })

  if (!repair) redirect("/coordinator/repairs")

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/coordinator/repairs">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Repairs
          </Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Repair Ticket</h2>
      </div>

      <div className="bg-card p-6 rounded-lg border shadow-sm grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <p className="text-sm text-muted-foreground">Item Description</p>
          <p className="font-semibold">{repair.item_description}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Sent To</p>
          <p className="font-semibold">{repair.sent_to}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Vendor / Shop</p>
          <p className="font-semibold">{repair.vendor_shop || "N/A"}</p>
        </div>
      </div>

      <AuditableWorkflow
        currentStage={repair.status}
        stages={REPAIR_STAGES}
        events={repair.InternalRepairEvents}
        isFinal={repair.status === "READY" || repair.status === "SCRAPPED"}
        reopenStage="SENT_FOR_REPAIR" // Re-repair loop starts here
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
