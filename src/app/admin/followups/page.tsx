import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye } from "lucide-react"
import Link from "next/link"
import { NewFollowupDialog } from "./NewFollowupDialog"

export default async function AdminFollowupsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/")
  }

  const sp = await searchParams
  const currentStatus = sp.status === "RESOLVED" ? "RESOLVED" : "ACTIVE"

  const followups = await prisma.paymentFollowup.findMany({
    where: { status: currentStatus },
    orderBy: { created_at: "desc" },
    include: {
      Events: {
        orderBy: { created_at: "desc" },
        take: 1
      }
    }
  })

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Payment Followups</h2>
          <p className="text-muted-foreground">Manage and audit payment followups.</p>
        </div>
        <NewFollowupDialog />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Followups List</CardTitle>
          <div className="flex gap-2">
            <Button variant={currentStatus === "ACTIVE" ? "default" : "outline"} size="sm" render={<Link href="?status=ACTIVE" />}>
              Active
            </Button>
            <Button variant={currentStatus === "RESOLVED" ? "default" : "outline"} size="sm" render={<Link href="?status=RESOLVED" />}>
              Resolved
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Pending Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Remark</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {followups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                      No followups found.
                    </TableCell>
                  </TableRow>
                ) : (
                  followups.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.client_name}</TableCell>
                      <TableCell>₹{f.pending_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={f.status === "ACTIVE" ? "destructive" : "default"}>
                          {f.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {f.Events[0]?.remark || "No remarks"}
                      </TableCell>
                      <TableCell>{new Date(f.created_at).toLocaleDateString("en-GB")}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" render={<Link href={`/admin/followups/${f.id}`} />}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
