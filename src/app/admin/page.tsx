import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { GlobalProgressDashboard } from "@/components/shared/GlobalProgressDashboard"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") redirect("/")

  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    select: { id: true, username: true },
    orderBy: { username: "asc" },
    take: 5
  })

  return (
    <div className="space-y-12 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground">Read-only overview of all company operations and employee logs.</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold">Global Progress</h3>
        <GlobalProgressDashboard basePathPrefix="/admin" />
      </div>

      <div className="space-y-4 pt-8 border-t">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">Employees (Preview)</h3>
          <Link href="/admin/employees">
            <Button variant="outline" size="sm">View All Employees</Button>
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {employees.map(emp => (
            <Link href={`/admin/employees/${emp.id}`} key={emp.id}>
              <Card className="cursor-pointer hover:shadow-md transition-all hover:border-indigo-300 h-full">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                      {emp.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">{emp.username}</h4>
                      <p className="text-sm text-muted-foreground">Employee</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {employees.length === 0 && (
            <p className="text-muted-foreground col-span-full">No employees found.</p>
          )}
        </div>
      </div>
    </div>
  )
}

