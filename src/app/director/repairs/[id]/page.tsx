import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { RepairsDetailView } from "@/components/shared/views/RepairsDetailView"

export default async function DirectorRepairDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "DIRECTOR") redirect("/")

  return <RepairsDetailView id={id} basePath="/director/repairs" isReadOnly={true} />
}
