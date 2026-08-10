import prisma from "@/lib/prisma"
import { AuditableWorkflow } from "@/components/shared/AuditableWorkflow"
import { transitionQuotation, addQuotationRemark, reopenQuotation } from "@/actions/quotations"
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { redirect } from "next/navigation"

const QUOTATION_STAGES = [
  "RECORDED",
  "APPROVED_TO_PROCEED",
  "VISIT",
  "PRICE_RECEIVED",
  "DRAFT",
  "FINAL_APPROVAL",
  "SENT",
  "DROPPED"
]

export async function QuotationsDetailView({ 
  id, 
  basePath, 
  isReadOnly = false 
}: { 
  id: string, 
  basePath: string, 
  isReadOnly?: boolean 
}) {
  const req = await prisma.quotation.findUnique({
    where: { id: id },
    include: {
      QuotationEvents: {
        include: { user: { select: { username: true } } },
        orderBy: { created_at: "asc" }
      },
      customer: true,
    }
  })

  if (!req) redirect(basePath)

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href={basePath} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Quotations
          </Link>
        <h2 className="text-3xl font-bold tracking-tight">Quotation: {req.customer?.name}</h2>
      </div>

      <div className="bg-card p-6 rounded-lg border shadow-sm grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <p className="text-sm text-muted-foreground">Description</p>
          <p className="font-semibold whitespace-pre-wrap">{req.description}</p>
        </div>
        {req.amount && (
          <div>
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="font-semibold">{req.amount}</p>
          </div>
        )}
      </div>

      <AuditableWorkflow
        currentStage={req.status}
        stages={QUOTATION_STAGES}
        events={req.QuotationEvents}
        isFinal={req.status === "SENT" || req.status === "DROPPED"}
        reopenStage="RECORDED"
        readOnly={isReadOnly}
        onTransition={async (newStage, remark) => {
          "use server"
          await transitionQuotation(req.id, newStage, remark)
        }}
        onAddRemark={async (remark) => {
          "use server"
          await addQuotationRemark(req.id, remark)
        }}
        onReopen={async (remark) => {
          "use server"
          await reopenQuotation(req.id, remark)
        }}
      />
    </div>
  )
}
