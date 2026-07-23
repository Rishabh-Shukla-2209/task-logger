"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { EntityComboboxField } from "@/components/shared/EntityComboboxField"
import { Plus } from "lucide-react"

export function NewQuotationDialog({ createAction }: { createAction: (formData: FormData) => Promise<void> }) {
  const [open, setOpen] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    await createAction(formData)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="lg" />}>
        <Plus className="mr-2 w-5 h-5" /> Add New Quotation
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Quotation</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Customer</label>
            <EntityComboboxField type="customer" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea name="description" placeholder="Description of items / services..." required rows={3} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Amount (Optional)</label>
            <Input name="amount" type="number" step="0.01" placeholder="e.g. 500.00" />
          </div>

          <Button type="submit" className="w-full">Create Quotation</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
