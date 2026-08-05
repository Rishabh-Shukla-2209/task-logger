"use client"

import { useEffect } from "react"
import { handleError } from "@/lib/errorHandler"

export function GlobalErrorListener() {
  useEffect(() => {
    // Catch unhandled promise rejections (often thrown by failed Server Actions not wrapped in try/catch)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Prevent the default browser console error if desired, but usually we leave it
      // event.preventDefault() 
      handleError(event.reason)
    }

    // Catch general uncaught JS errors
    const handleWindowError = (event: ErrorEvent) => {
      handleError(event.error || event.message)
    }

    window.addEventListener("unhandledrejection", handleUnhandledRejection)
    window.addEventListener("error", handleWindowError)

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
      window.removeEventListener("error", handleWindowError)
    }
  }, [])

  return null
}
