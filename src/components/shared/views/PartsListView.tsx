import prisma from "@/lib/prisma"
import { createPartRequest } from "@/actions/parts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { Eye } from "lucide-react"
import { PageLayout } from "@/components/coordinator/PageLayout"
import { DataTable } from "@/components/coordinator/DataTable"
import { NewPartDialog } from "@/components/coordinator/NewPartDialog"
import { Prisma } from "@prisma/client"
import { DateFilters, FiltersForm } from "@/components/coordinator/DataTableFilters"

export async function PartsListView({ 
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

  const where: Prisma.PartRequestWhereInput = {}

  if (q) {
    where.part_name = { contains: q, mode: "insensitive" }
  }

  if (active) {
    where.status = { notIn: ["RECEIVED", "DROPPED"] }
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

  const [totalCount, parts] = await Promise.all([
    prisma.partRequest.count({ where }),
    prisma.partRequest.findMany({
      where,
      include: { requested_by: true },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })
  ])

  return (
    <PageLayout
      title="Parts Ordering"
      description="Manage and track part requests."
      headerAction={isReadOnly ? undefined : <NewPartDialog createAction={createPartRequest} />}
    >
      <DataTable 
        totalCount={totalCount} 
        pageSize={pageSize}
        filters={<FiltersForm><DateFilters /></FiltersForm>}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Part</TableHead>
              <TableHead>For</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No parts requested.
                </TableCell>
              </TableRow>
            ) : (
              parts.map((part) => (
                <TableRow key={part.id}>
                  <TableCell className="font-medium max-w-[150px] truncate sm:max-w-[200px] md:max-w-[300px]" title={part.part_name}>{part.part_name}</TableCell>
                  <TableCell className="max-w-[100px] truncate sm:max-w-[150px]" title={part.for_whom}>{part.for_whom}</TableCell>
                  <TableCell className="max-w-[100px] truncate sm:max-w-[150px]" title={part.requested_by.username}>{part.requested_by.username}</TableCell>
                  <TableCell>
                    <Badge variant={part.status === "RECEIVED" ? "default" : part.status === "DROPPED" ? "destructive" : "secondary"}>
                      {part.status.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`${basePath}/${part.id}`} className={buttonVariants({ variant: "ghost", size: "sm", className: "cursor-pointer" })}>
                      
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
