import prisma from "@/lib/prisma"
import { createServiceQuery } from "@/actions/queries"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { Eye } from "lucide-react"
import { PageLayout } from "@/components/coordinator/PageLayout"
import { DataTable } from "@/components/coordinator/DataTable"
import { NewQueryDialog } from "@/components/coordinator/NewQueryDialog"
import { Prisma, QueryType } from "@prisma/client"
import { DateFilters, QueryTypeFilter, FiltersForm } from "@/components/coordinator/DataTableFilters"

export async function QueriesListView({ 
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
  const type = sp.type as QueryType | undefined

  const where: Prisma.ServiceQueryWhereInput = {}
  
  if (q) {
    where.customer = {
      name: { contains: q, mode: "insensitive" }
    }
  }

  if (active) {
    where.status = { notIn: ["RESOLVED", "DROPPED"] }
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

  if (type) {
    where.query_type = type
  }

  const [totalCount, queries] = await Promise.all([
    prisma.serviceQuery.count({ where }),
    prisma.serviceQuery.findMany({
      where,
      include: { customer: true },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })
  ])

  return (
    <PageLayout
      title="Service Desk"
      description="Manage service queries through the pipeline."
      headerAction={isReadOnly ? undefined : <NewQueryDialog createAction={createServiceQuery} />}
    >
      <DataTable 
        totalCount={totalCount} 
        pageSize={pageSize}
        filters={
          <FiltersForm>
            <DateFilters />
            <QueryTypeFilter />
          </FiltersForm>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Step</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No queries found.
                </TableCell>
              </TableRow>
            ) : (
              queries.map((query) => (
                <TableRow key={query.id}>
                  <TableCell className="font-medium max-w-[150px] truncate sm:max-w-[200px] md:max-w-[300px]" title={query.customer.name}>{query.customer.name}</TableCell>
                  <TableCell><Badge variant="outline">{query.query_type.replace(/_/g, " ")}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={query.status === "RESOLVED" ? "default" : query.status === "DROPPED" ? "destructive" : "secondary"}>
                      {query.status.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(query.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Link href={`${basePath}/${query.id}`} className={buttonVariants({ variant: "ghost", size: "sm", className: "cursor-pointer" })}>
                      
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
