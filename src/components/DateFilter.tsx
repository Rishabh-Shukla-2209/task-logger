"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useState } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Filter, FilterX } from "lucide-react"
import { cn } from "@/lib/utils"

export function DateFilter({ defaultStart, defaultEnd }: { defaultStart?: string, defaultEnd?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasActiveFilters = searchParams.has("start") || searchParams.has("end")

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    const params = new URLSearchParams(searchParams.toString())
    
    const start = formData.get("start") as string | null
    const end = formData.get("end") as string | null

    if (start && !end) {
      setError("Please select a 'To' date as well.")
      return
    }
    if (!start && end) {
      setError("Please select a 'From' date as well.")
      return
    }

    if (start) params.set("start", start)
    else params.delete("start")

    if (end) params.set("end", end)
    else params.delete("end")

    router.push(`${pathname}?${params.toString()}`, { scroll: false })
    setOpen(false)
  }

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("start")
    params.delete("end")
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const startVal = searchParams.get("start") || defaultStart || ""
  const endVal = searchParams.get("end") || defaultEnd || ""

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
              <p className="text-sm text-muted-foreground">Set your date filters here.</p>
            </div>
            
            {error && <div className="text-sm font-medium text-destructive">{error}</div>}

            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">From Date</label>
                <Input 
                  type="date" 
                  name="start"
                  defaultValue={startVal}
                  className="h-9 w-full"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">To Date</label>
                <Input 
                  type="date" 
                  name="end"
                  defaultValue={endVal}
                  className="h-9 w-full"
                />
              </div>
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
