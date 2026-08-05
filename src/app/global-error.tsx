"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("GlobalError caught a critical error:", error)
    if (error.message && !error.message.includes("NEXT_REDIRECT")) {
      toast.error(error.message || "A fatal error occurred")
    }
  }, [error])

  return (
    <html lang="en">
      <body className={`${inter.className} bg-background min-h-screen flex items-center justify-center text-foreground`}>
        <div className="text-center space-y-4 px-4">
          <h2 className="text-3xl font-bold text-red-600">A critical error occurred</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            The application encountered an unrecoverable error. Please try reloading the page.
          </p>
          <button 
            onClick={() => reset()} 
            className="px-6 py-2 mt-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium transition-colors"
          >
            Reload application
          </button>
        </div>
      </body>
    </html>
  )
}
