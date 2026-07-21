import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { createPartRequest, updatePartPricing, markPartOrdered, markPartReceived } from "@/actions/parts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
        <p className="text-muted-foreground">Request parts, track pricing, and receive deliveries.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-[320px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Request Part</CardTitle>
            <CardDescription>Submit a new part request.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createPartRequest} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Part Name</label>
                <Input name="part_name" required placeholder="e.g. iPhone 13 Screen" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">For Whom (order/customer)</label>
                <Input name="for_whom" required placeholder="e.g. Order #123 / Ramesh" />
              </div>
              <Button type="submit" className="w-full cursor-pointer">Submit Request</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Part Requests</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part</TableHead>
                  <TableHead>For</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.part_name}</TableCell>
                    <TableCell>{p.for_whom}</TableCell>
                    <TableCell><Badge variant="outline">{p.status}</Badge></TableCell>
                    <TableCell>{p.pricing_received_at ? new Date(p.pricing_received_at).toLocaleDateString() : "-"}</TableCell>
                    <TableCell>{p.approved_by_boss_at ? new Date(p.approved_by_boss_at).toLocaleDateString() : "-"}</TableCell>
                    <TableCell>
                      {p.status === "PENDING" && (
                        <form action={async () => { "use server"; await updatePartPricing(p.id) }}>
                          <Button type="submit" size="sm" variant="secondary" className="cursor-pointer">Mark Priced</Button>
                        </form>
                      )}
                      {p.status === "APPROVED" && (
                        <form action={async () => { "use server"; await markPartOrdered(p.id) }}>
                          <Button type="submit" size="sm" variant="secondary" className="cursor-pointer">Mark Ordered</Button>
                        </form>
                      )}
                      {p.status === "ORDERED" && (
                        <form action={async () => { "use server"; await markPartReceived(p.id) }}>
                          <Button type="submit" size="sm" className="cursor-pointer">Mark Received</Button>
                        </form>
                      )}
                      {p.status === "PRICED" && (
                        <span className="text-xs text-muted-foreground">Awaiting boss approval</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {parts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No parts requested.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
