import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default async function WarrantyPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") redirect("/")

  const warranties = await prisma.warrantyExchange.findMany({
    orderBy: { created_at: "desc" },
  })

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Warranty Exchanges</h2>
        <p className="text-muted-foreground">Manage warranty claims.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Warranty Claims</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warranties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">No warranty claims found.</TableCell>
                </TableRow>
              ) : (
                warranties.map((warranty) => (
                  <TableRow key={warranty.id}>
                    <TableCell className="font-medium">{warranty.customer_name}</TableCell>
                    <TableCell>{warranty.device_details}</TableCell>
                    <TableCell>{warranty.reason}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{warranty.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <a href={`/coordinator/warranty/${warranty.id}`} className="text-indigo-600 hover:underline">View</a>
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
