import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { InternalRepairsList } from "@/components/coordinator/InternalRepairsList"

export default async function RepairsPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") redirect("/")

  const repairs = await prisma.internalRepair.findMany({
    orderBy: { created_at: "desc" },
  })

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Internal Repairs</h2>
        <p className="text-muted-foreground">Manage internal repair tickets and currently out items.</p>
      </div>

      <InternalRepairsList repairs={repairs} />
    </div>
  )
}
