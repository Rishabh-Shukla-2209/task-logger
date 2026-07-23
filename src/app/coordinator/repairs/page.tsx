import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { createInternalRepair } from "@/actions/repairs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Eye } from "lucide-react"
import { PageLayout } from "@/components/coordinator/PageLayout"
import { DataTable } from "@/components/coordinator/DataTable"
import { NewRepairDialog } from "@/components/coordinator/NewRepairDialog"
import { Prisma } from "@prisma/client"

export default async function CoordinatorRepairsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") redirect("/")

  const sp = await searchParams
  const q = sp.q || ""
  const active = sp.active !== "false"
  const page = parseInt(sp.page || "1", 10)
  const pageSize = 15

  const where: Prisma.InternalRepairWhereInput = {}
  
  if (q) {
    where.supplier = {
      name: { contains: q, mode: "insensitive" }
    }
  }

  if (active) {
    where.status = { notIn: ["READY", "SCRAPPED", "DROPPED"] }
  }

  const [totalCount, repairs] = await Promise.all([
    prisma.internalRepair.count({ where }),
    prisma.internalRepair.findMany({
      where,
      include: { supplier: true },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })
  ])

  return (
    <PageLayout
      title="Internal Repairs"
      description="Manage and track items sent for internal or vendor repair."
      headerAction={<NewRepairDialog createAction={createInternalRepair} />}
    >
      <DataTable totalCount={totalCount} pageSize={pageSize}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Sent Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {repairs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No repairs found.
                </TableCell>
              </TableRow>
            ) : (
              repairs.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium max-w-[150px] truncate sm:max-w-[200px] md:max-w-[300px]" title={r.item_description}>{r.item_description}</TableCell>
                  <TableCell className="max-w-[100px] truncate sm:max-w-[150px]" title={r.supplier.name}>{r.supplier.name}</TableCell>
                  <TableCell>{new Date(r.sent_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={["READY", "SCRAPPED", "DROPPED"].includes(r.status) ? "default" : "secondary"}>
                      {r.status.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/coordinator/repairs/${r.id}`}>
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
