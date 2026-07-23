"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { EntityComboboxField } from "@/components/shared/EntityComboboxField"
import { Plus } from "lucide-react"

export function NewPartDialog({ createAction }: { createAction: (formData: FormData) => Promise<void> }) {
  const [open, setOpen] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    await createAction(formData)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="lg" />}>
        <Plus className="mr-2 w-5 h-5" /> Add New Part Request
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Part Request</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Part Name</label>
            <Input name="part_name" placeholder="e.g. Dell 7400 Battery" required />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">For Whom? (Customer / Internal)</label>
            <Input name="for_whom" placeholder="Customer Name or 'Internal Repair'" required />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Supplier (Optional initially)</label>
            <EntityComboboxField type="supplier" />
          </div>

          <Button type="submit" className="w-full">Create Request</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
