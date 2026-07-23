import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function AdminEmployeesPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") redirect("/")

  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    select: { id: true, username: true },
    orderBy: { username: "asc" }
  })

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Employees</h2>
          <p className="text-muted-foreground">Directory of all employees and their work history.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {employees.map(emp => (
          <Card key={emp.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl">
                  {emp.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{emp.username}</h3>
                  <p className="text-sm text-muted-foreground">Employee</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Link href={`/admin/employees/${emp.id}`}>
                  <Button variant="outline" size="sm">
                    View History
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}

        {employees.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
            No employees found.
          </div>
        )}
      </div>
    </div>
  )
}
