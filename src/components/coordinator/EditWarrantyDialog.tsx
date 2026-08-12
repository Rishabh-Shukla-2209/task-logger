"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { EntityComboboxField } from "@/components/shared/EntityComboboxField"
import { Edit, Loader2 } from "lucide-react"
import { handleError } from "@/lib/errorHandler"

export function EditWarrantyDialog({ initialData, updateAction }: { initialData: any, updateAction: (id: string, formData: FormData) => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    try {
      await updateAction(initialData.id, formData)
      setOpen(false)
    } catch (error) {
      handleError(error, "Failed to update warranty claim")
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
          <DialogTitle>Edit Warranty Claim</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Supplier / Vendor</label>
            <EntityComboboxField type="supplier" initialValue={initialData.supplier_id} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Device Details</label>
            <Input name="device_details" placeholder="e.g. Seagate 1TB HDD (SN: 12345)" required defaultValue={initialData.device_details || ""} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Reason / Issue</label>
            <Textarea name="reason" placeholder="Describe the defect..." required rows={3} defaultValue={initialData.reason || ""} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Exchange With (Optional)</label>
            <Input name="exchange_with" placeholder="Replacement SN if known" defaultValue={initialData.exchange_with || ""} />
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