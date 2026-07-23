import prisma from "@/lib/prisma"
import { AuditableWorkflow } from "@/components/shared/AuditableWorkflow"
import { transitionQuotation, addQuotationRemark } from "@/actions/quotations"
import { Button } from "@/components/ui/button"
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
  const quotation = await prisma.quotation.findUnique({
    where: { id: id },
    include: {
      QuotationEvents: {
        include: { user: { select: { username: true } } },
        orderBy: { created_at: "asc" }
      },
      customer: true,
    }
  })

  if (!quotation) redirect(basePath)

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href={basePath}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Quotations
          </Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Quotation: {quotation.customer?.name}</h2>
      </div>

      <div className="bg-card p-6 rounded-lg border shadow-sm grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <p className="text-sm text-muted-foreground">Description</p>
          <p className="font-semibold whitespace-pre-wrap">{quotation.description}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Amount</p>
          <p className="font-semibold">{quotation.amount || "N/A"}</p>
        </div>
      </div>

      <AuditableWorkflow
        currentStage={quotation.status}
        stages={QUOTATION_STAGES}
        events={quotation.QuotationEvents}
        isFinal={quotation.status === "SENT" || quotation.status === "DROPPED"}
        readOnly={isReadOnly}
        onTransition={async (newStage, remark) => {
          "use server"
          await transitionQuotation(quotation.id, newStage, remark)
        }}
        onAddRemark={async (remark) => {
          "use server"
          await addQuotationRemark(quotation.id, remark)
        }}
      />
    </div>
  )
}
