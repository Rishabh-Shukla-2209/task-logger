"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("ErrorBoundary caught an error:", error)
    
    // Ignore NEXT_REDIRECT errors as they are not actual errors
    if (error.message && !error.message.includes("NEXT_REDIRECT")) {
      toast.error(error.message || "An unexpected error occurred")
    }
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 px-4">
      <h2 className="text-2xl font-bold tracking-tight text-red-600">Something went wrong!</h2>
      <p className="text-muted-foreground max-w-md text-center">
        An unexpected error has occurred while rendering this page. Our team has been notified.
      </p>
      <Button onClick={() => reset()} variant="outline">Try again</Button>
    </div>
  )
}
