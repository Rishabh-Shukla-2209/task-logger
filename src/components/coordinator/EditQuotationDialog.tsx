"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { EntityComboboxField } from "@/components/shared/EntityComboboxField"
import { Edit, Loader2 } from "lucide-react"
import { handleError } from "@/lib/errorHandler"

export function EditQuotationDialog({ initialData, updateAction }: { initialData: any, updateAction: (id: string, formData: FormData) => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    try {
      await updateAction(initialData.id, formData)
      setOpen(false)
    } catch (error) {
      handleError(error, "Failed to update quotation")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Edit className="w-4 h-4 mr-2" /> Edit Info
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Quotation</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Customer</label>
            <EntityComboboxField type="customer" initialValue={initialData.customer_id} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea name="description" placeholder="Description of items / services..." required rows={3} defaultValue={initialData.description || ""} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Amount (Optional)</label>
            <Input name="amount" type="number" step="0.01" placeholder="e.g. 500.00" defaultValue={initialData.amount || ""} />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}