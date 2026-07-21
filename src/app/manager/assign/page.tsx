import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { assignTaskToEmployee } from "@/actions/tasks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function ManagerAssignPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "MANAGER") redirect("/")

  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    orderBy: { username: "asc" },
  })

  const recentAssignments = await prisma.taskAssignment.findMany({
    include: { assigned_to: true, assigned_by: true },
    orderBy: { created_at: "desc" },
    take: 20,
  })

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Assign Tasks</h2>
        <p className="text-muted-foreground">Assign tasks or directives to specific employees.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-[350px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>New Assignment</CardTitle>
            <CardDescription>Assign a task to an employee.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={assignTaskToEmployee} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Employee</label>
                <Select name="assigned_to_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.username}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Task Description</label>
                <Textarea name="description" required placeholder="What needs to be done?" rows={3} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Due Date (optional)</label>
                <Input name="due_date" type="date" />
              </div>

              <Button type="submit" className="w-full cursor-pointer">Assign</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Assigned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAssignments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.assigned_to.username}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{a.description}</TableCell>
                    <TableCell>{a.due_date ? new Date(a.due_date).toLocaleDateString() : "-"}</TableCell>
                    <TableCell>{new Date(a.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                {recentAssignments.length === 0 && (
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
    </div>
  )
}
