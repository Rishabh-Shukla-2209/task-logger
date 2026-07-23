import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { QuotationsListView } from "@/components/shared/views/QuotationsListView"

export default async function AdminQuotationsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") redirect("/")

  return <QuotationsListView searchParams={searchParams} basePath="/admin/quotations" isReadOnly={true} />
}
