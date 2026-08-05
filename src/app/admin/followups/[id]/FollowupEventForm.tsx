"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { addFollowupEvent } from "@/actions/followup-actions"
import { handleError } from "@/lib/errorHandler"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function FollowupEventForm({ followupId }: { followupId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      formData.append("followup_id", followupId)
      await addFollowupEvent(formData)
      // Reset form
      const form = e.target as HTMLFormElement
      form.reset()
      router.refresh()
    } catch (error) {
      handleError(error, "Failed to add followup event")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Update</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Action</label>
            <select name="action" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" required>
              <option value="FOLLOW_UP">Follow Up</option>
              <option value="RESOLVED">Resolved (Payment Received)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount Change (₹)</label>
            <Input name="amount_change" type="number" step="0.01" placeholder="e.g. +500 or -200" />
            <p className="text-xs text-muted-foreground">
              Optional. Positive to increase pending amount, negative to decrease.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Remark</label>
            <Textarea name="remark" required placeholder="What happened in this follow up?" />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Update
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
