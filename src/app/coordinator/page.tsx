import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { QueriesListView } from "@/components/shared/views/QueriesListView"

export default async function CoordinatorPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") redirect("/")

  return <QueriesListView searchParams={searchParams} basePath="/coordinator" />
}
