import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default async function CoordinatorPartsPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") redirect("/")

  const parts = await prisma.partRequest.findMany({
    orderBy: { created_at: "desc" },
    include: { requested_by: true },
  })

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Parts Ordering</h2>
        <p className="text-muted-foreground">Manage and track part requests.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Part Requests</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Part</TableHead>
                <TableHead>For</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">No parts requested.</TableCell>
                </TableRow>
              ) : (
                parts.map((part) => (
                  <TableRow key={part.id}>
                    <TableCell className="font-medium">{part.part_name}</TableCell>
                    <TableCell>{part.for_whom}</TableCell>
                    <TableCell>{part.requested_by.username}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{part.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <a href={`/coordinator/parts/${part.id}`} className="text-indigo-600 hover:underline">View</a>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
