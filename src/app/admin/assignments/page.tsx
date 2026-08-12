import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AssignmentBrowser } from "@/components/employee/AssignmentBrowser"

export default async function AdminAssignmentsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/")
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Assignments</h2>
        <p className="text-muted-foreground">Tasks assigned to you by management.</p>
      </div>

      <AssignmentBrowser userId="self" />
    </div>
  )
}
