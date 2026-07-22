import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { AuditableWorkflow } from "@/components/shared/AuditableWorkflow"
import { transitionPartRequest, addPartRequestRemark } from "@/actions/parts"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

const PART_STAGES = [
  "RECORDED",
  "PRICING_RECEIVED",
  "APPROVED_BY_BOSS",
  "ORDERED",
  "RECEIVED"
]

export default async function PartRequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions)
  if (!session || !["COORDINATOR", "MANAGER", "ADMIN"].includes(session.user.role)) redirect("/")
  
  const isReadOnly = session.user.role !== "COORDINATOR"

  const part = await prisma.partRequest.findUnique({
    where: { id: id },
    include: {
      PartRequestEvents: {
        include: { user: { select: { username: true } } },
        orderBy: { created_at: "asc" }
      },
      requested_by: { select: { username: true } }
    }
  })

  if (!part) redirect("/coordinator/parts")

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/coordinator/parts">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Parts
          </Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Part Request: {part.part_name}</h2>
      </div>

      <div className="bg-card p-6 rounded-lg border shadow-sm grid md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">For</p>
          <p className="font-semibold">{part.for_whom}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Requested By</p>
          <p className="font-semibold">{part.requested_by.username}</p>
        </div>
      </div>

      <AuditableWorkflow
        currentStage={part.status}
        stages={PART_STAGES}
        events={part.PartRequestEvents}
        isFinal={part.status === "RECEIVED"}
        reopenStage="RECORDED"
        readOnly={isReadOnly}
        onTransition={async (newStage, remark) => {
          "use server"
          await transitionPartRequest(part.id, newStage, remark)
        }}
        onAddRemark={async (remark) => {
          "use server"
          await addPartRequestRemark(part.id, remark)
        }}
      />
    </div>
  )
}
