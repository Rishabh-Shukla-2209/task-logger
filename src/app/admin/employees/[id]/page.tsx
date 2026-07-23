import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { TaskHistoryBrowser } from "@/components/shared/TaskHistoryBrowser"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, User } from "lucide-react"

export default async function AdminEmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") redirect("/")

  const employee = await prisma.user.findUnique({
    where: { id }
  })

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-2xl font-bold mb-4">Employee not found</h2>
        <Link href="/admin/employees">
          <Button variant="outline">Back to Employees</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/employees">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
              {employee.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{employee.username}&apos;s Task History</h2>
              <p className="text-muted-foreground">Showing approved tasks only</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-6 shadow-sm">
        <TaskHistoryBrowser userId={id} status="APPROVED" />
      </div>
    </div>
  )
}
