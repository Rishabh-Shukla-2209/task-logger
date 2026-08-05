"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { EntityComboboxField } from "@/components/shared/EntityComboboxField"
import { Plus, Loader2 } from "lucide-react"
import { handleError } from "@/lib/errorHandler"

export function NewRepairDialog({ createAction }: { createAction: (formData: FormData) => Promise<void> }) {
  const [open, setOpen] = useState(false)

  const [loading, setLoading] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    try {
      await createAction(formData)
      setOpen(false)
    } catch (error) {
      handleError(error, "Failed to create repair ticket")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="lg" />}>
        <Plus className="mr-2 w-5 h-5" /> Add New Repair
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Internal Repair</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Item Description</label>
            <Input name="item_description" placeholder="e.g. Broken LCD Panel" required />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Vendor / Supplier</label>
            <EntityComboboxField type="supplier" />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Repair Ticket
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
