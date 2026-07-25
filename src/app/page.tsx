import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (session.user.role === "EMPLOYEE") {
    redirect("/employee")
  } else if (session.user.role === "COORDINATOR") {
    redirect("/coordinator")
  } else if (session.user.role === "DIRECTOR") {
    redirect("/director")
  } else if (session.user.role === "MANAGER") {
    redirect("/manager")
  } else if (session.user.role === "ACCOUNTANT") {
    redirect("/accountant")
  }

  return (
    <div className="p-8 text-center text-red-500">
      Unknown role or configuration error.
    </div>
  )
}
