import prisma from "@/lib/prisma"
import { AuditableWorkflow } from "@/components/shared/AuditableWorkflow"
import { transitionWarrantyExchange, addWarrantyExchangeRemark } from "@/actions/warranty"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { redirect } from "next/navigation"

const WARRANTY_STAGES = [
  "ADDED",
  "WARRANTY_CLAIMED",
  "DROPPED"
]

export async function WarrantyDetailView({ 
  id, 
  basePath, 
  isReadOnly = false 
}: { 
  id: string, 
  basePath: string, 
  isReadOnly?: boolean 
}) {
  const warranty = await prisma.warrantyExchange.findUnique({
    where: { id: id },
    include: {
      WarrantyExchangeEvents: {
        include: { user: { select: { username: true } } },
        orderBy: { created_at: "asc" }
      },
      supplier: true,
    }
  })

  if (!warranty) redirect(basePath)

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href={basePath}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Warranty Claims
          </Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Warranty Claim</h2>
      </div>

      <div className="bg-card p-6 rounded-lg border shadow-sm grid md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Supplier / Vendor</p>
          <p className="font-semibold">{warranty.supplier?.name}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Device Details</p>
          <p className="font-semibold">{warranty.device_details}</p>
        </div>
        <div className="md:col-span-2">
          <p className="text-sm text-muted-foreground">Issue / Reason</p>
          <p className="font-semibold">{warranty.reason}</p>
        </div>
      </div>

      <AuditableWorkflow
        currentStage={warranty.status}
        stages={WARRANTY_STAGES}
        events={warranty.WarrantyExchangeEvents}
        isFinal={warranty.status === "WARRANTY_CLAIMED" || warranty.status === "DROPPED"}
        readOnly={isReadOnly}
        onTransition={async (newStage, remark) => {
          "use server"
          await transitionWarrantyExchange(warranty.id, newStage, remark)
        }}
        onAddRemark={async (remark) => {
          "use server"
          await addWarrantyExchangeRemark(warranty.id, remark)
        }}
      />
    </div>
  )
}
