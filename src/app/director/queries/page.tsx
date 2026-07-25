import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { QueriesListView } from "@/components/shared/views/QueriesListView"

export default async function DirectorQueriesPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "DIRECTOR") redirect("/")

  return <QueriesListView searchParams={searchParams} basePath="/director/queries" isReadOnly={true} />
}
