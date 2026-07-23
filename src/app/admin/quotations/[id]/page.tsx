import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { QuotationsDetailView } from "@/components/shared/views/QuotationsDetailView"

export default async function AdminQuotationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") redirect("/")

  return <QuotationsDetailView id={id} basePath="/admin/quotations" isReadOnly={true} />
}
