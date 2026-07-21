import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { createInternalRepair, markRepairReceived } from "@/actions/repairs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default async function RepairsPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") redirect("/")

  const repairs = await prisma.internalRepair.findMany({
    orderBy: { created_at: "desc" },
  })

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Internal Repairs</h2>
        <p className="text-muted-foreground">Track items sent out for repair.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-[320px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Send for Repair</CardTitle>
            <CardDescription>Record an item sent out.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createInternalRepair} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Item Description</label>
                <Input name="item_description" required placeholder="e.g. HP 440 motherboard" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Sent To (vendor/shop)</label>
                <Input name="sent_to" required placeholder="e.g. Nehru Place Shop #42" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Sent Date</label>
                <Input name="sent_date" type="date" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (optional)</label>
                <Textarea name="notes" placeholder="Any extra notes" rows={2} />
              </div>
              <Button type="submit" className="w-full cursor-pointer">Record</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>All Repairs</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Sent To</TableHead>
                  <TableHead>Sent Date</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repairs.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.item_description}</TableCell>
                    <TableCell>{r.sent_to}</TableCell>
                    <TableCell>{new Date(r.sent_date).toLocaleDateString()}</TableCell>
                    <TableCell>{r.received_date ? new Date(r.received_date).toLocaleDateString() : "-"}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === "RECEIVED_BACK" ? "default" : "secondary"}>
                        {r.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {r.status === "SENT_OUT" && (
                        <form action={async (formData: FormData) => {
                          "use server"
                          await markRepairReceived(r.id, formData)
                        }}>
                          <input type="hidden" name="received_date" value={new Date().toISOString().split("T")[0]} />
                          <Button type="submit" size="sm" className="cursor-pointer">Mark Received</Button>
                        </form>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {repairs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No repairs recorded.</TableCell>
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
