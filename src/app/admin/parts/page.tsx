import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { approvePartPurchase } from "@/actions/parts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default async function AdminPartsPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") redirect("/")

  const parts = await prisma.partRequest.findMany({
    orderBy: { created_at: "desc" },
    include: { requested_by: true },
  })

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Parts / Inventory</h2>
        <p className="text-muted-foreground">Review part requests and approve purchases.</p>
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
                <TableHead>Pricing Recv.</TableHead>
                <TableHead>Approved</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.part_name}</TableCell>
                  <TableCell>{p.for_whom}</TableCell>
                  <TableCell>{p.requested_by.username}</TableCell>
                  <TableCell><Badge variant="outline">{p.status}</Badge></TableCell>
                  <TableCell>{p.pricing_received_at ? new Date(p.pricing_received_at).toLocaleDateString() : "-"}</TableCell>
                  <TableCell>{p.approved_by_boss_at ? new Date(p.approved_by_boss_at).toLocaleDateString() : "-"}</TableCell>
                  <TableCell>
                    {p.status === "PRICED" ? (
                      <form action={async () => {
                        "use server"
                        await approvePartPurchase(p.id)
                      }}>
                        <Button type="submit" size="sm" className="cursor-pointer">Approve Purchase</Button>
                      </form>
                    ) : p.status === "APPROVED" || p.status === "ORDERED" || p.status === "RECEIVED" ? (
                      <span className="text-sm text-green-600 font-medium">✓ Approved</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Awaiting pricing</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {parts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No parts requested.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
