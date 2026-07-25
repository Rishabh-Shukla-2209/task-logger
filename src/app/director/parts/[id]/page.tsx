import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PartsDetailView } from "@/components/shared/views/PartsDetailView"

export default async function DirectorPartDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "DIRECTOR") redirect("/")

  return <PartsDetailView id={id} basePath="/director/parts" isReadOnly={true} />
}
