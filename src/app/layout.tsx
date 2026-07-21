import type { Metadata } from "next"
import { Inter, Geist } from "next/font/google"
import "./globals.css"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Link from "next/link"
import { LogOut } from "lucide-react"
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Task Logger",
  description: "Minimalist MVP for task logging and queries",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en">
      <body className={`${inter.className} bg-background min-h-screen flex text-foreground`}>
        {session ? (
          <SidebarProvider>
            <AppSidebar role={session.user.role} />
            <main className="flex-1 w-full relative">
              <div className="absolute top-4 left-4 z-50">
                <SidebarTrigger />
              </div>
              <div className="p-8 mt-8">
                {children}
              </div>
            </main>
          </SidebarProvider>
        ) : (
          <main className="flex-1 w-full mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        )}
      </body>
    </html>
  )
}
