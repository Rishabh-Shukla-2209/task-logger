import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { createServiceQuery } from "@/actions/queries"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Eye } from "lucide-react"

const QUERY_TYPES = [
  { value: "NEW_SALE", label: "New Sale" },
  { value: "RENT", label: "Rent" },
  { value: "SALE_REPAIR", label: "Sale Repair" },
  { value: "RENT_REPAIR", label: "Rent Repair" },
  { value: "SALE_REPLACEMENT", label: "Sale Replacement" },
  { value: "RENT_REPLACEMENT", label: "Rent Replacement" },
  { value: "GENERAL_REPAIR", label: "General Repair" },
] as const

export default async function CoordinatorPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") redirect("/")

  const activeQueries = await prisma.serviceQuery.findMany({
    where: { status: { not: "RESOLVED" } },
    orderBy: { created_at: "desc" },
  })

  const resolvedQueries = await prisma.serviceQuery.findMany({
    where: { status: "RESOLVED" },
    orderBy: { updated_at: "desc" },
    take: 20,
  })

  const isReplacement = (type: string) =>
    type === "SALE_REPLACEMENT" || type === "RENT_REPLACEMENT"

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Service Desk</h2>
        <p className="text-muted-foreground">Manage service queries through the 7-step pipeline.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-[320px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>New Query</CardTitle>
            <CardDescription>Record a new service query.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createServiceQuery} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Customer Name</label>
                <Input name="customer_name" required placeholder="Customer name" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Query Type</label>
                <Select name="query_type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUERY_TYPES.map((qt) => (
                      <SelectItem key={qt.value} value={qt.value}>{qt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Device / Item Details</label>
                <Input name="device_details" placeholder="e.g. Dell 7400 i5 8GB" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Replacement Reason (if applicable)</label>
                <Textarea name="replacement_reason" placeholder="Why is replacement needed?" rows={2} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Replaced With (if applicable)</label>
                <Input name="replaced_with" placeholder="What was it replaced with?" />
              </div>

              <Button type="submit" className="w-full cursor-pointer">Record Query</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active">
              <TabsList className="mb-4">
                <TabsTrigger value="active" className="cursor-pointer">Active ({activeQueries.length})</TabsTrigger>
                <TabsTrigger value="resolved" className="cursor-pointer">Resolved ({resolvedQueries.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="active">
                <QueryTable queries={activeQueries} />
              </TabsContent>

              <TabsContent value="resolved">
                <QueryTable queries={resolvedQueries} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function QueryTable({ queries }: { queries: Array<{
  id: string
  customer_name: string
  query_type: string
  status: string
  created_at: Date
}> }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Step</TableHead>
          <TableHead>Date</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {queries.map((q) => (
          <TableRow key={q.id}>
            <TableCell className="font-medium">{q.customer_name}</TableCell>
            <TableCell><Badge variant="outline">{q.query_type.replace(/_/g, " ")}</Badge></TableCell>
            <TableCell><Badge>{q.status.replace(/_/g, " ")}</Badge></TableCell>
            <TableCell>{new Date(q.created_at).toLocaleDateString()}</TableCell>
            <TableCell>
              <Link href={`/coordinator/queries/${q.id}`}>
                <Button variant="ghost" size="sm" className="cursor-pointer">
                  <Eye className="w-4 h-4 mr-1" /> View
                </Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
        {queries.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
              No queries.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
