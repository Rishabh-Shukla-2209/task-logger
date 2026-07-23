import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { createServiceQuery } from "@/actions/queries"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Eye } from "lucide-react"
import { PageLayout } from "@/components/coordinator/PageLayout"
import { DataTable } from "@/components/coordinator/DataTable"
import { NewQueryDialog } from "@/components/coordinator/NewQueryDialog"
import { Prisma } from "@prisma/client"

export default async function CoordinatorPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") redirect("/")

  const sp = await searchParams
  const q = sp.q || ""
  const active = sp.active !== "false"
  const page = parseInt(sp.page || "1", 10)
  const pageSize = 15

  const where: Prisma.ServiceQueryWhereInput = {}
  
  if (q) {
    where.customer = {
      name: { contains: q, mode: "insensitive" }
    }
  }

  if (active) {
    where.status = { notIn: ["RESOLVED", "DROPPED"] }
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
      headerAction={<NewQueryDialog createAction={createServiceQuery} />}
    >
      <DataTable totalCount={totalCount} pageSize={pageSize}>
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
                    <Link href={`/coordinator/queries/${query.id}`}>
                      <Button variant="ghost" size="sm" className="cursor-pointer">
                        <Eye className="w-4 h-4 mr-1" /> View
                      </Button>
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
