import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PartsDetailView } from "@/components/shared/views/PartsDetailView"

export default async function PartRequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions)
  if (!session || !["COORDINATOR", "MANAGER", "ADMIN"].includes(session.user.role)) redirect("/")
  
  const isReadOnly = session.user.role !== "COORDINATOR"

  return <PartsDetailView id={id} basePath="/coordinator/parts" isReadOnly={isReadOnly} />
}
