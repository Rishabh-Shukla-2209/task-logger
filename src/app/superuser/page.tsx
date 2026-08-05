import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { fetchUsers } from "@/actions/superuser"
import { SuperuserDashboardClient } from "./SuperuserDashboardClient"

export default async function SuperuserPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "SUPERUSER") {
    redirect("/")
  }

  const users = await fetchUsers()

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Superuser Dashboard</h2>
        <p className="text-muted-foreground">Manage application users, roles, and access.</p>
      </div>

      <SuperuserDashboardClient initialUsers={users} />
    </div>
  )
}
