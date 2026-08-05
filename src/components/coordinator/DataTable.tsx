"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { ReactNode, useCallback, useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"

interface DataTableProps {
  children: ReactNode
  totalCount: number
  pageSize: number
  filters?: ReactNode
}

export function DataTable({ children, totalCount, pageSize, filters }: DataTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const defaultSearch = searchParams.get("q") || ""
  const defaultActive = searchParams.get("active") !== "false"
  const defaultPage = parseInt(searchParams.get("page") || "1", 10)

  const [search, setSearch] = useState(defaultSearch)
  const debouncedSearch = useDebounce(search, 300)
  
  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })
      return params.toString()
    },
    [searchParams]
  )

  // Sync search state to URL
  useEffect(() => {
    const currentQ = searchParams.get("q") || ""
    if (debouncedSearch !== currentQ) {
      const q = debouncedSearch || null
      // Reset to page 1 on new search
      const newQs = createQueryString({ q, page: "1" })
      router.push(`${pathname}?${newQs}`, { scroll: false })
    }
  }, [debouncedSearch, pathname, router, searchParams, createQueryString])

  const handleActiveToggle = (checked: boolean) => {
    const active = checked ? null : "false" // Default is true, so only set false if unchecking
    const newQs = createQueryString({ active, page: "1" })
    router.push(`${pathname}?${newQs}`, { scroll: false })
  }

  const handlePageChange = (newPage: number) => {
    const newQs = createQueryString({ page: newPage.toString() })
    router.push(`${pathname}?${newQs}`, { scroll: false })
  }

  const totalPages = Math.ceil(totalCount / pageSize) || 1
  const currentPage = Math.min(defaultPage, totalPages)

  return (
    <div className="flex flex-col space-y-4 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {filters}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="active-only"
              checked={defaultActive}
              onCheckedChange={(checked) => handleActiveToggle(checked as boolean)}
            />
            <label
              htmlFor="active-only"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer whitespace-nowrap"
            >
              Active Tickets Only
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-md border">
        {children}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {Math.min((currentPage - 1) * pageSize + 1, totalCount)} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} entries
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <div className="text-sm font-medium w-16 text-center">
            {currentPage} / {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
