import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PartsListView } from "@/components/shared/views/PartsListView"

export default async function CoordinatorPartsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") redirect("/")

  return <PartsListView searchParams={searchParams} basePath="/coordinator/parts" />
}
