"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { EntityComboboxField } from "@/components/shared/EntityComboboxField"
import { Plus } from "lucide-react"

export function NewWarrantyDialog({ createAction }: { createAction: (formData: FormData) => Promise<void> }) {
  const [open, setOpen] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    await createAction(formData)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="lg" />}>
        <Plus className="mr-2 w-5 h-5" /> Add New Warranty Claim
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Warranty Claim</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Supplier / Vendor</label>
            <EntityComboboxField type="supplier" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Device Details</label>
            <Input name="device_details" placeholder="e.g. Seagate 1TB HDD (SN: 12345)" required />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Reason / Issue</label>
            <Textarea name="reason" placeholder="Describe the defect..." required rows={3} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Exchange With (Optional)</label>
            <Input name="exchange_with" placeholder="Replacement SN if known" />
          </div>

          <Button type="submit" className="w-full">Create Warranty Claim</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
