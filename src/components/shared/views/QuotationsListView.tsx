import prisma from "@/lib/prisma"
import { createQuotation } from "@/actions/quotations"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { Eye } from "lucide-react"
import { PageLayout } from "@/components/coordinator/PageLayout"
import { DataTable } from "@/components/coordinator/DataTable"
import { NewQuotationDialog } from "@/components/coordinator/NewQuotationDialog"
import { Prisma } from "@prisma/client"
import { DateFilters, FiltersForm } from "@/components/coordinator/DataTableFilters"

export async function QuotationsListView({ 
  searchParams, 
  basePath, 
  isReadOnly = false 
}: { 
  searchParams: Promise<{ [key: string]: string | undefined }>,
  basePath: string,
  isReadOnly?: boolean
}) {
  const sp = await searchParams
  const q = sp.q || ""
  const active = sp.active !== "false"
  const page = parseInt(sp.page || "1", 10)
  const pageSize = 15
  
  const from = sp.from as string
  const to = sp.to as string

  const where: Prisma.QuotationWhereInput = {}
  
  if (q) {
    where.customer = {
      name: { contains: q, mode: "insensitive" }
    }
  }

  if (active) {
    where.status = { notIn: ["SENT", "DROPPED"] } // SENT is the final success stage
  }

  if (from || to) {
    where.created_at = {}
    if (from) {
      where.created_at.gte = new Date(`${from}T00:00:00.000Z`)
    }
    if (to) {
      where.created_at.lte = new Date(`${to}T23:59:59.999Z`)
    }
  }

  const [totalCount, quotations] = await Promise.all([
    prisma.quotation.count({ where }),
    prisma.quotation.findMany({
      where,
      include: { customer: true },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })
  ])

  return (
    <PageLayout
      title="Quotations"
      description="Manage and track customer quotations."
      headerAction={isReadOnly ? undefined : <NewQuotationDialog createAction={createQuotation} />}
    >
      <DataTable 
        totalCount={totalCount} 
        pageSize={pageSize}
        filters={<FiltersForm><DateFilters /></FiltersForm>}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No quotations found.
                </TableCell>
              </TableRow>
            ) : (
              quotations.map((quotation) => (
                <TableRow key={quotation.id}>
                  <TableCell className="font-medium max-w-[120px] truncate sm:max-w-[150px] md:max-w-[200px]" title={quotation.customer.name}>{quotation.customer.name}</TableCell>
                  <TableCell className="max-w-[150px] truncate sm:max-w-[200px] md:max-w-[300px]" title={quotation.description}>{quotation.description}</TableCell>
                  <TableCell>{quotation.amount || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant={quotation.status === "SENT" ? "default" : quotation.status === "DROPPED" ? "destructive" : "secondary"}>
                      {quotation.status.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`${basePath}/${quotation.id}`} className={buttonVariants({ variant: "ghost", size: "sm", className: "cursor-pointer" })}>
                      
                        <Eye className="w-4 h-4 mr-1" /> View
                      
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </DataTable>
    </PageLayout>
  )
}
