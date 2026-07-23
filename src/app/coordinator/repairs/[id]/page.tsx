import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { RepairsDetailView } from "@/components/shared/views/RepairsDetailView"

export default async function RepairDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions)
  if (!session || !["COORDINATOR", "MANAGER", "ADMIN"].includes(session.user.role)) redirect("/")
  
  const isReadOnly = session.user.role !== "COORDINATOR"

  return <RepairsDetailView id={id} basePath="/coordinator/repairs" isReadOnly={isReadOnly} />
}
