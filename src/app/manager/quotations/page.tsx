import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { QuotationsListView } from "@/components/shared/views/QuotationsListView"

export default async function ManagerQuotationsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "MANAGER") redirect("/")

  return <QuotationsListView searchParams={searchParams} basePath="/manager/quotations" isReadOnly={true} />
}
