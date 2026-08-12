"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EntityComboboxField } from "@/components/shared/EntityComboboxField"
import { Edit, Loader2 } from "lucide-react"
import { handleError } from "@/lib/errorHandler"

const QUERY_TYPES = [
  { value: "NEW_SALE", label: "New Sale" },
  { value: "RENT", label: "Rent" },
  { value: "SALE_REPAIR", label: "Sale Repair" },
  { value: "RENT_REPAIR", label: "Rent Repair" },
  { value: "SALE_REPLACEMENT", label: "Sale Replacement" },
  { value: "RENT_REPLACEMENT", label: "Rent Replacement" },
  { value: "GENERAL_REPAIR", label: "General Repair" },
] as const

export function EditQueryDialog({ initialData, updateAction }: { initialData: any, updateAction: (id: string, formData: FormData) => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [queryType, setQueryType] = useState<string>(initialData.query_type || "")

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    try {
      await updateAction(initialData.id, formData)
      setOpen(false)
    } catch (error) {
      handleError(error, "Failed to update query")
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
          <DialogTitle>Edit Query</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Customer</label>
            <EntityComboboxField type="customer" initialValue={initialData.customer_id} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Query Type</label>
            <Select name="query_type" value={queryType} onValueChange={(v: string | null) => setQueryType(v || "")} required>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {QUERY_TYPES.map((qt) => (
                  <SelectItem key={qt.value} value={qt.value}>{qt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Device / Item Details</label>
            <Input name="device_details" placeholder="e.g. Dell 7400 i5 8GB" defaultValue={initialData.device_details || ""} />
          </div>

          {(queryType === "SALE_REPLACEMENT" || queryType === "RENT_REPLACEMENT" || queryType === "SALE_REPAIR" || queryType === "RENT_REPAIR") && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason</label>
              <Textarea name="replacement_reason" placeholder="Why is this requested?" rows={2} required defaultValue={initialData.replacement_reason || ""} />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}