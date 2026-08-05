"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2 } from "lucide-react"
import { handleError } from "@/lib/errorHandler"
import { createFollowup } from "@/actions/followup-actions"
import { useRouter } from "next/navigation"

export function NewFollowupDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      await createFollowup(formData)
      setOpen(false)
      router.refresh()
    } catch (error) {
      handleError(error, "Failed to create followup")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" /> New Followup
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Payment Followup</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Client Name</label>
            <Input name="client_name" required placeholder="Enter client name" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Pending Amount (₹)</label>
            <Input name="pending_amount" type="number" step="0.01" required placeholder="0.00" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Remark</label>
            <Textarea name="remark" placeholder="Initial follow up details..." rows={3} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
