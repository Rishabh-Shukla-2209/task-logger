import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CallingModule } from "@/components/shared/calling/CallingModule"

export default async function SalesCallingPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "SALES") {
    redirect("/")
  }

  return (
    <div className="max-w-7xl mx-auto">
      <CallingModule userId={session.user.id} />
    </div>
  )
}
