import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { TaskHistoryBrowser } from "@/components/shared/TaskHistoryBrowser"

export default async function EmployeeHistoryPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "EMPLOYEE") {
    redirect("/")
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Task History</h2>
        <p className="text-muted-foreground">View all your past logged tasks.</p>
      </div>
      <TaskHistoryBrowser userId="self" />
    </div>
  )
}
