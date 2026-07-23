import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default async function AdminEmployeesPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") redirect("/")

  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    include: {
      Tasks: {
        orderBy: { created_at: "desc" },
        take: 10,
      },
    },
    orderBy: { username: "asc" },
  })

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Employees</h2>
        <p className="text-muted-foreground">Read-only view of employee roster and task history.</p>
      </div>

      <div className="space-y-6">
        {employees.map((employee) => (
          <Card key={employee.id}>
            <CardHeader className="bg-muted/50 border-b">
              <div className="flex justify-between items-center">
                <CardTitle>{employee.username}</CardTitle>
                <Badge>{employee.role}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {employee.Tasks.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employee.Tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>{new Date(task.log_date).toLocaleDateString()}</TableCell>
                        <TableCell className="max-w-[300px] truncate">{task.description}</TableCell>
                        <TableCell>{task.time_taken_minutes ? `${task.time_taken_minutes} mins` : "-"}</TableCell>
                        <TableCell>
                          <Badge variant={
                            task.status === "APPROVED" ? "default" :
                            task.status === "REJECTED" ? "destructive" : "secondary"
                          }>
                            {task.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-sm">No tasks logged yet.</p>
              )}
            </CardContent>
          </Card>
        ))}
        {employees.length === 0 && (
          <p className="text-muted-foreground">No employees found.</p>
        )}
      </div>
    </div>
  )
}
