"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button, buttonVariants } from "@/components/ui/button"
import { ReactNode, useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Filter, FilterX } from "lucide-react"
import { cn } from "@/lib/utils"

export function FiltersForm({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasActiveFilters = Array.from(searchParams.keys()).some(k => ["from", "to", "type"].includes(k))

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    const params = new URLSearchParams(searchParams.toString())
    
    const inputs = Array.from(e.currentTarget.elements) as HTMLInputElement[]
    const names = new Set(inputs.map(i => i.name).filter(Boolean))

    const updates: Record<string, string | null> = {}
    names.forEach(name => {
      const val = formData.get(name) as string | null
      updates[name] = val || null
    })

    // Validation for dates
    if (updates.from && !updates.to) {
      setError("Please select a 'To' date as well.")
      return
    }
    if (!updates.from && updates.to) {
      setError("Please select a 'From' date as well.")
      return
    }

    // Determine if any filters are actually set
    const hasValues = Object.values(updates).some(val => val !== null)

    Object.entries(updates).forEach(([key, val]) => {
      if (val) {
        params.set(key, val)
      } else {
        params.delete(key)
      }
    })
    
    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
    setOpen(false)
  }

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("from")
    params.delete("to")
    params.delete("type")
    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={(isOpen) => { setOpen(isOpen); setError(null); }}>
        <PopoverTrigger 
          className={cn(buttonVariants({ variant: hasActiveFilters ? "secondary" : "outline" }), "h-10 border-dashed")} 
          title="Filters"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 rounded-full bg-primary w-2 h-2" />
          )}
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="end">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Filters</h4>
              <p className="text-sm text-muted-foreground">Set your table filters here.</p>
            </div>
            
            {error && <div className="text-sm font-medium text-destructive">{error}</div>}

            <div className="flex flex-col gap-4">
              {children}
            </div>
            
            <div className="flex justify-end gap-2 mt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Apply</Button>
            </div>
          </form>
        </PopoverContent>
      </Popover>

      {hasActiveFilters && (
        <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-foreground" onClick={clearFilters} title="Clear Filters">
          <FilterX className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

export function DateFilters() {
  const searchParams = useSearchParams()
  const from = searchParams.get("from") || ""
  const to = searchParams.get("to") || ""

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">From Date</label>
        <Input 
          type="date" 
          name="from"
          defaultValue={from}
          className="h-9 w-full"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">To Date</label>
        <Input 
          type="date" 
          name="to"
          defaultValue={to}
          className="h-9 w-full"
        />
      </div>
    </div>
  )
}

export function QueryTypeFilter() {
  const searchParams = useSearchParams()
  const type = searchParams.get("type") || ""

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">Query Type</label>
      <select 
        name="type"
        defaultValue={type}
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">All Types</option>
        <option value="NEW_SALE">New Sale</option>
        <option value="RENT">Rent</option>
        <option value="SALE_REPAIR">Sale Repair</option>
        <option value="RENT_REPAIR">Rent Repair</option>
        <option value="SALE_REPLACEMENT">Sale Replacement</option>
        <option value="RENT_REPLACEMENT">Rent Replacement</option>
        <option value="GENERAL_REPAIR">General Repair</option>
      </select>
    </div>
  )
}
