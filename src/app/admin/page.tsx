import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") redirect("/")

  const [
    employeeCount,
    loggedTasks,
    approvedTasks,
    activeQueries,
    resolvedQueries,
    pendingParts,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "EMPLOYEE" } }),
    prisma.task.count({ where: { status: "LOGGED" } }),
    prisma.task.count({ where: { status: "APPROVED" } }),
    prisma.serviceQuery.count({ where: { status: { not: "RESOLVED" } } }),
    prisma.serviceQuery.count({ where: { status: "RESOLVED" } }),
    prisma.partRequest.count({ where: { status: { in: ["PENDING", "PRICED"] } } }),
  ])

  const stats = [
    { label: "Employees", value: employeeCount, color: "text-blue-600" },
    { label: "Pending Logs", value: loggedTasks, color: "text-amber-600" },
    { label: "Approved Logs", value: approvedTasks, color: "text-green-600" },
    { label: "Active Queries", value: activeQueries, color: "text-purple-600" },
    { label: "Resolved Queries", value: resolvedQueries, color: "text-emerald-600" },
    { label: "Parts Awaiting", value: pendingParts, color: "text-orange-600" },
  ]

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground">Read-only overview of all company operations.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6 text-center">
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
