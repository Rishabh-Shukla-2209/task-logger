import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { WarrantyDetailView } from "@/components/shared/views/WarrantyDetailView"

export default async function WarrantyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") redirect("/")

  return <WarrantyDetailView id={id} basePath="/coordinator/warranty" isReadOnly={false} />
}
