import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { TaskHistoryBrowser } from "@/components/shared/TaskHistoryBrowser"

export default async function AccountantHistoryPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ACCOUNTANT") redirect("/")

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Task History</h2>
        <p className="text-muted-foreground">View your approved and logged tasks history.</p>
      </div>

      <div className="bg-card border rounded-lg p-6 shadow-sm">
        <TaskHistoryBrowser />
      </div>
    </div>
  )
}
