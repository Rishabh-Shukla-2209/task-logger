import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { QueriesDetailView } from "@/components/shared/views/QueriesDetailView"

export default async function QueryDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions)
  if (!session || !["COORDINATOR", "MANAGER", "ADMIN"].includes(session.user.role)) redirect("/")

  const isReadOnly = session.user.role !== "COORDINATOR"

  return <QueriesDetailView id={id} basePath="/coordinator/queries" isReadOnly={isReadOnly} />
}
