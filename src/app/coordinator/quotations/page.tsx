import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { createQuotation, updateQuotationStatus } from "@/actions/quotations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { QuotationStatus } from "@prisma/client"

const STATUS_OPTIONS: QuotationStatus[] = ["DRAFT", "SENT", "ACCEPTED", "REJECTED"]

export default async function QuotationsPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") redirect("/")

  const quotations = await prisma.quotation.findMany({
    orderBy: { created_at: "desc" },
  })

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Quotations</h2>
        <p className="text-muted-foreground">Track quotation status for customers.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-[320px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>New Quotation</CardTitle>
            <CardDescription>Record a new quotation.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createQuotation} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Customer Name</label>
                <Input name="customer_name" required placeholder="Customer" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea name="description" required placeholder="What is being quoted?" rows={3} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount (optional)</label>
                <Input name="amount" placeholder="e.g. ₹25,000" />
              </div>
              <Button type="submit" className="w-full cursor-pointer">Create Quotation</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>All Quotations</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium">{q.customer_name}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{q.description}</TableCell>
                    <TableCell>{q.amount || "-"}</TableCell>
                    <TableCell><Badge variant="outline">{q.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {STATUS_OPTIONS.filter((s) => s !== q.status).map((s) => (
                          <form key={s} action={async () => {
                            "use server"
                            await updateQuotationStatus(q.id, s)
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
                {quotations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No quotations.</TableCell>
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
