import { toast } from "sonner"

export function handleError(error: unknown, fallbackMessage = "An unexpected error occurred") {
  console.error(error)

  let message = fallbackMessage

  if (error instanceof Error) {
    // Next.js Server Actions mask errors in production with this generic message
    // We don't want to show this ugly string to users.
    if (!error.message.includes("Server Components render") && !error.message.includes("NEXT_REDIRECT")) {
      message = error.message
    }
  } else if (typeof error === "string") {
    message = error
  }

  // Prevent showing NEXT_REDIRECT errors as they are expected navigational events in Next.js
  if (message.includes("NEXT_REDIRECT")) {
    return;
  }

  toast.error(message)
}
