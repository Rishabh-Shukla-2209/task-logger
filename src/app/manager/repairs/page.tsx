import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { RepairsListView } from "@/components/shared/views/RepairsListView"

export default async function ManagerRepairsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "MANAGER") redirect("/")

  return <RepairsListView searchParams={searchParams} basePath="/manager/repairs" isReadOnly={true} />
}
