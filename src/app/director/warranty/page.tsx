import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { WarrantyListView } from "@/components/shared/views/WarrantyListView"

export default async function DirectorWarrantyPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "DIRECTOR") redirect("/")

  return <WarrantyListView searchParams={searchParams} basePath="/director/warranty" isReadOnly={true} />
}
