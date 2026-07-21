import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { createWarrantyExchange, updateWarrantyStatus } from "@/actions/warranty"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { WarrantyStatus } from "@prisma/client"

const STATUS_OPTIONS: WarrantyStatus[] = ["RECORDED", "PROCESSING", "COMPLETED"]

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
        <p className="text-muted-foreground">Track warranty exchange requests.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-[320px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>New Exchange</CardTitle>
            <CardDescription>Record a warranty exchange.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createWarrantyExchange} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Customer Name</label>
                <Input name="customer_name" required placeholder="Customer" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Device Details</label>
                <Input name="device_details" required placeholder="e.g. Dell 7400" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Reason for Exchange</label>
                <Textarea name="reason" required placeholder="Why is warranty exchange needed?" rows={3} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Exchange With (optional)</label>
                <Input name="exchange_with" placeholder="Replacement item" />
              </div>
              <Button type="submit" className="w-full cursor-pointer">Record Exchange</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>All Warranty Exchanges</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Exchange With</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warranties.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{w.customer_name}</TableCell>
                    <TableCell>{w.device_details}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{w.reason}</TableCell>
                    <TableCell>{w.exchange_with || "-"}</TableCell>
                    <TableCell><Badge variant="outline">{w.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {STATUS_OPTIONS.filter((s) => s !== w.status).map((s) => (
                          <form key={s} action={async () => {
                            "use server"
                            await updateWarrantyStatus(w.id, s)
                          }}>
                            <Button type="submit" size="sm" variant="ghost" className="cursor-pointer text-xs">
                              → {s}
                            </Button>
                          </form>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {warranties.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No warranty exchanges.</TableCell>
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
