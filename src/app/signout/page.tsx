"use client";

import { signOut } from "next-auth/react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogOut, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SignOutPage() {
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg text-center">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full text-red-600">
              <LogOut className="w-8 h-8" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Sign Out</CardTitle>
          <CardDescription>
            Are you sure you want to sign out of your account?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You will need to enter your credentials again to access the Task Logger.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <Button 
            variant="outline" 
            className="w-full sm:w-1/2 h-11"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <Button 
            variant="destructive"
            className="w-full sm:w-1/2 h-11" 
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
