import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { QuotationsListView } from "@/components/shared/views/QuotationsListView"

export default async function DirectorQuotationsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "DIRECTOR") redirect("/")

  return <QuotationsListView searchParams={searchParams} basePath="/director/quotations" isReadOnly={true} />
}
