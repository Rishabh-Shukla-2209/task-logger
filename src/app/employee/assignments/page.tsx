import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function EmployeeAssignmentsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "EMPLOYEE") {
    redirect("/")
  }

  const assignments = await prisma.taskAssignment.findMany({
    where: { assigned_to_id: session.user.id },
    include: { assigned_by: true },
    orderBy: { created_at: "desc" },
  })

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Assignments</h2>
        <p className="text-muted-foreground">Tasks assigned to you by management.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Assigned By</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Assigned On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.description}</TableCell>
                  <TableCell>{a.assigned_by.username}</TableCell>
                  <TableCell>{a.due_date ? new Date(a.due_date).toLocaleDateString() : "-"}</TableCell>
                  <TableCell>{new Date(a.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {assignments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No assignments yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
