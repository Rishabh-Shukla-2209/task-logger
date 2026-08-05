import prisma from "@/lib/prisma"
import { createWarrantyExchange } from "@/actions/warranty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { Eye } from "lucide-react"
import { PageLayout } from "@/components/coordinator/PageLayout"
import { DataTable } from "@/components/coordinator/DataTable"
import { NewWarrantyDialog } from "@/components/coordinator/NewWarrantyDialog"
import { Prisma } from "@prisma/client"
import { DateFilters, FiltersForm } from "@/components/coordinator/DataTableFilters"

export async function WarrantyListView({ 
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

  const where: Prisma.WarrantyExchangeWhereInput = {}
  
  if (q) {
    where.supplier = {
      name: { contains: q, mode: "insensitive" }
    }
  }

  if (active) {
    where.status = { notIn: ["WARRANTY_CLAIMED", "DROPPED"] }
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

  const [totalCount, warranties] = await Promise.all([
    prisma.warrantyExchange.count({ where }),
    prisma.warrantyExchange.findMany({
      where,
      include: { supplier: true },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })
  ])

  return (
    <PageLayout
      title="Warranty Exchange"
      description="Track components sent for warranty replacement."
      headerAction={isReadOnly ? undefined : <NewWarrantyDialog createAction={createWarrantyExchange} />}
    >
      <DataTable 
        totalCount={totalCount} 
        pageSize={pageSize}
        filters={<FiltersForm><DateFilters /></FiltersForm>}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {warranties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No warranty exchanges found.
                </TableCell>
              </TableRow>
            ) : (
              warranties.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium max-w-[120px] truncate sm:max-w-[150px]" title={w.supplier.name}>{w.supplier.name}</TableCell>
                  <TableCell className="max-w-[120px] truncate sm:max-w-[150px] md:max-w-[200px]" title={w.device_details}>{w.device_details}</TableCell>
                  <TableCell className="max-w-[150px] truncate sm:max-w-[200px] md:max-w-[300px]" title={w.reason}>{w.reason}</TableCell>
                  <TableCell>
                    <Badge variant={w.status === "WARRANTY_CLAIMED" ? "default" : w.status === "DROPPED" ? "destructive" : "secondary"}>
                      {w.status.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`${basePath}/${w.id}`} className={buttonVariants({ variant: "ghost", size: "sm", className: "cursor-pointer" })}>
                      
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
