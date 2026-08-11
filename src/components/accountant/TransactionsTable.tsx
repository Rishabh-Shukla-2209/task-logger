"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import Link from "next/link"
import { Plus, FileText, Filter, X, Check } from "lucide-react"
import { TransactionType } from "@prisma/client"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

function MultiSelectFilter({ title, options, selected, onChange }: { title: string, options: string[], selected: string[], onChange: (vals: string[]) => void }) {
  const [open, setOpen] = useState(false)
  if (options.length === 0) return null
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 border-dashed")}>
        {title}
        {selected.length > 0 && (
          <Badge variant="secondary" className="ml-2 rounded-sm px-1 font-normal">
            {selected.length} selected
          </Badge>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <div className="p-2 font-medium text-sm border-b">{title}</div>
        <ScrollArea className="max-h-[200px]">
          <div className="p-2 space-y-2">
            {options.map(opt => {
              const isChecked = selected.includes(opt)
              return (
                <div key={opt} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`filter-${title}-${opt}`} 
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      if (checked) onChange([...selected, opt])
                      else onChange(selected.filter(x => x !== opt))
                    }}
                  />
                  <label htmlFor={`filter-${title}-${opt}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                    {opt}
                  </label>
                </div>
              )
            })}
          </div>
        </ScrollArea>
        {selected.length > 0 && (
          <div className="p-2 border-t">
            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => onChange([])}>
              Clear filters
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export function TransactionsTable({
  transactions,
  type,
  title,
  description,
  basePath,
  analysisComponent,
  startDate,
  endDate
}: {
  transactions: any[],
  type: TransactionType,
  title?: string,
  description?: string,
  basePath?: string,
  analysisComponent?: React.ReactNode,
  startDate?: string,
  endDate?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const prefix = basePath || '/accountant'

  const formatDate = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
  }

  const isRent = type === "RENT";
  const isSale = type === "SALE";
  const displayTitle = title || type;
  const displayDescription = description || `Manage ${type.toLowerCase()} transactions.`;

  // UI state for showing filters
  const [showFilters, setShowFilters] = useState(false)
  const [dateError, setDateError] = useState<string | null>(null)

  // Filter states
  const [filterCustomer, setFilterCustomer] = useState<string[]>([])
  const [filterSupplier, setFilterSupplier] = useState<string[]>([])
  const [filterSalesperson, setFilterSalesperson] = useState<string[]>([])
  const [filterModel, setFilterModel] = useState<string[]>([])
  const [filterProcessor, setFilterProcessor] = useState<string[]>([])
  const [filterGeneration, setFilterGeneration] = useState<string[]>([])
  const [filterCategory, setFilterCategory] = useState<string[]>([])
  const [filterType, setFilterType] = useState<string[]>([])
  const [filterRam, setFilterRam] = useState<string[]>([])
  const [filterSsd, setFilterSsd] = useState<string[]>([])
  const [filterMake, setFilterMake] = useState<string[]>([])

  // Extract unique options from loaded transactions
  const uniqueCustomers = useMemo(() => Array.from(new Set(transactions.map(t => t.customer?.name).filter(Boolean))) as string[], [transactions])
  const uniqueSalespersons = useMemo(() => Array.from(new Set(transactions.map(t => t.salesperson?.username).filter(Boolean))) as string[], [transactions])
  
  const uniqueSuppliers = useMemo(() => {
    const set = new Set<string>()
    transactions.forEach(tx => {
      if (tx.supplier?.name) set.add(tx.supplier.name)
      tx.LineItems?.forEach((li: any) => {
        if (li.supplier?.name) set.add(li.supplier.name)
      })
    })
    return Array.from(set).filter(Boolean) as string[]
  }, [transactions])
  
  const uniqueModels = useMemo(() => Array.from(new Set(transactions.flatMap(t => t.LineItems?.map((li: any) => li.item_model)).filter(Boolean))) as string[], [transactions])
  const uniqueProcessors = useMemo(() => Array.from(new Set(transactions.flatMap(t => t.LineItems?.map((li: any) => li.processor)).filter(Boolean))) as string[], [transactions])
  const uniqueGenerations = useMemo(() => Array.from(new Set(transactions.flatMap(t => t.LineItems?.map((li: any) => li.generation)).filter(Boolean))) as string[], [transactions])
  const uniqueCategories = useMemo(() => Array.from(new Set(transactions.flatMap(t => t.LineItems?.map((li: any) => li.category)).filter(Boolean))) as string[], [transactions])
  const uniqueTypes = useMemo(() => Array.from(new Set(transactions.flatMap(t => t.LineItems?.map((li: any) => li.type)).filter(Boolean))) as string[], [transactions])
  const uniqueMakes = useMemo(() => Array.from(new Set(transactions.flatMap(t => t.LineItems?.map((li: any) => li.make)).filter(Boolean))) as string[], [transactions])
  const uniqueRam = useMemo(() => Array.from(new Set(transactions.flatMap(t => t.LineItems?.map((li: any) => li.ram_gb ? String(li.ram_gb) : null)).filter(Boolean))) as string[], [transactions])
  const uniqueSsd = useMemo(() => Array.from(new Set(transactions.flatMap(t => t.LineItems?.map((li: any) => li.ssd_gb ? String(li.ssd_gb) : null)).filter(Boolean))) as string[], [transactions])

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchCustomer = filterCustomer.length === 0 || filterCustomer.includes(tx.customer?.name)
      const matchSalesperson = filterSalesperson.length === 0 || filterSalesperson.includes(tx.salesperson?.name)
      
      const txSupplierName = tx.supplier?.name
      const liSupplierNames = tx.LineItems?.map((li: any) => li.supplier?.name).filter(Boolean) || []
      const matchSupplier = filterSupplier.length === 0 || 
        (txSupplierName && filterSupplier.includes(txSupplierName)) || 
        liSupplierNames.some((n: string) => filterSupplier.includes(n))

      const matchModel = filterModel.length === 0 || tx.LineItems?.some((li: any) => filterModel.includes(li.item_model))
      const matchProcessor = filterProcessor.length === 0 || tx.LineItems?.some((li: any) => filterProcessor.includes(li.processor))
      const matchGeneration = filterGeneration.length === 0 || tx.LineItems?.some((li: any) => filterGeneration.includes(li.generation))
      const matchCategory = filterCategory.length === 0 || tx.LineItems?.some((li: any) => filterCategory.includes(li.category))
      const matchType = filterType.length === 0 || tx.LineItems?.some((li: any) => filterType.includes(li.type))
      const matchMake = filterMake.length === 0 || tx.LineItems?.some((li: any) => filterMake.includes(li.make))
      const matchRam = filterRam.length === 0 || tx.LineItems?.some((li: any) => filterRam.includes(li.ram_gb ? String(li.ram_gb) : ''))
      const matchSsd = filterSsd.length === 0 || tx.LineItems?.some((li: any) => filterSsd.includes(li.ssd_gb ? String(li.ssd_gb) : ''))

      return matchCustomer && matchSalesperson && matchSupplier && matchModel && matchProcessor && matchGeneration && matchCategory && matchType && matchMake && matchRam && matchSsd
    })
  }, [transactions, filterCustomer, filterSalesperson, filterSupplier, filterModel, filterProcessor, filterGeneration, filterCategory, filterType, filterMake, filterRam, filterSsd])

  const totalValue = useMemo(() => {
    return filteredTransactions.reduce((acc, tx) => acc + (tx.total_value || 0), 0)
  }, [filteredTransactions])

  const handleDateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setDateError(null)
    const formData = new FormData(e.currentTarget)
    const params = new URLSearchParams(searchParams.toString())
    
    const start = formData.get("start") as string | null
    const end = formData.get("end") as string | null

    if (start && !end) {
      setDateError("Please select a 'To' date as well.")
      return
    }
    if (!start && end) {
      setDateError("Please select a 'From' date as well.")
      return
    }

    if (start) params.set("start", start)
    else params.delete("start")

    if (end) params.set("end", end)
    else params.delete("end")

    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const hasActiveFilters = filterCustomer.length > 0 || filterSalesperson.length > 0 || filterSupplier.length > 0 || filterModel.length > 0 || filterProcessor.length > 0 || filterGeneration.length > 0 || filterCategory.length > 0 || filterType.length > 0 || filterMake.length > 0 || filterRam.length > 0 || filterSsd.length > 0 || searchParams.has("start") || searchParams.has("end")

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {analysisComponent}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight capitalize">{displayTitle}</h2>
          <p className="text-muted-foreground">{displayDescription}</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant={showFilters || hasActiveFilters ? "secondary" : "outline"} onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {hasActiveFilters && (
               <Badge variant="default" className="ml-2 font-normal rounded-full w-2 h-2 p-0 px-0"></Badge>
            )}
          </Button>
          <Link href={`${prefix}/transactions/new?type=${type}`} className={buttonVariants({ variant: "default" })}>
            <Plus className="mr-2 h-4 w-4" /> Record {type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}
          </Link>
        </div>
      </div>

      {showFilters && (
        <Card className="bg-muted/30">
          <CardContent className="p-4 space-y-4">
            <form onSubmit={handleDateSubmit} className="flex flex-wrap items-end gap-3 pb-4 border-b">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">From Date</label>
                <Input type="date" name="start" defaultValue={searchParams.get("start") || startDate || ""} className="h-8" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">To Date</label>
                <Input type="date" name="end" defaultValue={searchParams.get("end") || endDate || ""} className="h-8" />
              </div>
              <Button type="submit" size="sm" className="h-8">Apply Date</Button>
              {searchParams.has("start") && (
                <Button type="button" variant="ghost" size="sm" className="h-8 text-muted-foreground" onClick={() => {
                  const params = new URLSearchParams(searchParams.toString())
                  params.delete("start")
                  params.delete("end")
                  router.push(`${pathname}?${params.toString()}`, { scroll: false })
                }}>
                  Clear Date
                </Button>
              )}
              {dateError && <span className="text-sm font-medium text-destructive ml-2">{dateError}</span>}
            </form>
            
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-muted-foreground mr-2">Filter Details:</span>
              <MultiSelectFilter title="Customer" options={uniqueCustomers} selected={filterCustomer} onChange={setFilterCustomer} />
              <MultiSelectFilter title="Supplier (Source)" options={uniqueSuppliers} selected={filterSupplier} onChange={setFilterSupplier} />
              <MultiSelectFilter title="Salesperson" options={uniqueSalespersons} selected={filterSalesperson} onChange={setFilterSalesperson} />
              <MultiSelectFilter title="Type" options={uniqueTypes} selected={filterType} onChange={setFilterType} />
              <MultiSelectFilter title="Category" options={uniqueCategories} selected={filterCategory} onChange={setFilterCategory} />
              <MultiSelectFilter title="Make" options={uniqueMakes} selected={filterMake} onChange={setFilterMake} />
              <MultiSelectFilter title="Model" options={uniqueModels} selected={filterModel} onChange={setFilterModel} />
              <MultiSelectFilter title="Processor" options={uniqueProcessors} selected={filterProcessor} onChange={setFilterProcessor} />
              <MultiSelectFilter title="Generation" options={uniqueGenerations} selected={filterGeneration} onChange={setFilterGeneration} />
              <MultiSelectFilter title="RAM (GB)" options={uniqueRam} selected={filterRam} onChange={setFilterRam} />
              <MultiSelectFilter title="SSD (GB)" options={uniqueSsd} selected={filterSsd} onChange={setFilterSsd} />
              
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-auto h-8 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setFilterCustomer([])
                    setFilterSupplier([])
                    setFilterSalesperson([])
                    setFilterModel([])
                    setFilterProcessor([])
                    setFilterGeneration([])
                    setFilterCategory([])
                    setFilterType([])
                    setFilterMake([])
                    setFilterRam([])
                    setFilterSsd([])
                    const params = new URLSearchParams(searchParams.toString())
                    if (params.has("start")) {
                      params.delete("start")
                      params.delete("end")
                      router.push(`${pathname}?${params.toString()}`, { scroll: false })
                    }
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear all filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="border rounded-lg overflow-hidden bg-background">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Item Details</TableHead>
              <TableHead>Customer / Supplier</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              {!isRent && (
                <>
                  <TableHead>Payment Status</TableHead>
                  <TableHead className="text-right">Pending</TableHead>
                  <TableHead>Account</TableHead>
                </>
              )}
              {isSale && <TableHead>Source</TableHead>}
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-12 text-muted-foreground">
                  No transactions found matching the criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="align-top whitespace-nowrap">
                    {formatDate(tx.created_at)}
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="flex flex-col space-y-3">
                      {tx.LineItems?.map((li: any) => (
                        <div key={li.id} className="text-sm">
                          {li.category || "Unknown"} ({(li.type === "SERIALIZED" && li.serial_numbers?.length > 0) ? li.serial_numbers.length : (li.quantity || 1)})
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="align-top min-w-[250px]">
                    <div className="flex flex-col space-y-3">
                      {tx.LineItems?.map((li: any) => {
                        const parts = []
                        if (li.make) parts.push(li.make)
                        if (li.item_model) parts.push(li.item_model)
                        if (li.processor) parts.push(li.processor)
                        if (li.generation) parts.push(li.generation)
                        if (li.ram_gb) parts.push(`${li.ram_gb}GB`)
                        if (li.ssd_gb) parts.push(`${li.ssd_gb}GB`)
                        if (li.screen_size) parts.push(li.screen_size)
                        
                        return (
                          <div key={li.id} className="text-sm font-medium">
                            {parts.length > 0 ? parts.join(" | ") : (li.bundle_name || "No details")}
                          </div>
                        )
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="align-top font-medium">
                    {tx.customer?.name || tx.supplier?.name || "N/A"}
                  </TableCell>
                  <TableCell className="align-top text-right whitespace-nowrap">
                    <div className="flex flex-col space-y-3">
                      {tx.LineItems?.map((li: any) => {
                        const rate = li.price_per_unit || 0;
                        return (
                          <div key={li.id} className="text-sm">
                            ₹{rate.toFixed(2)}
                          </div>
                        )
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="align-top text-right whitespace-nowrap text-emerald-600 font-medium">
                    <div className="flex flex-col space-y-3">
                      {tx.LineItems?.map((li: any) => {
                        const qty = (li.type === "SERIALIZED" && li.serial_numbers?.length > 0) ? li.serial_numbers.length : (li.quantity || 1);
                        const rate = li.price_per_unit || 0;
                        const total = li.total_price != null ? li.total_price : (rate * qty) || 0;
                        return (
                          <div key={li.id} className="text-sm">
                            ₹{total.toFixed(2)}
                          </div>
                        )
                      })}
                      {tx.LineItems?.length > 1 && (
                        <div className="text-sm border-t pt-2 mt-2">
                          ₹{tx.total_value.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  {!isRent && (
                    <>
                      <TableCell className="align-top">
                        <Badge variant={tx.payment_status === "PAID" ? "default" : tx.payment_status === "PARTIAL" ? "secondary" : "destructive"}>
                          {tx.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="align-top text-right whitespace-nowrap text-rose-600">
                        {tx.pending_amount > 0 ? `₹${tx.pending_amount.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className="align-top">
                        {tx.payment_account || "-"}
                      </TableCell>
                    </>
                  )}
                  {isSale && (
                    <TableCell className="align-top">
                      <div className="flex flex-col space-y-3 text-sm text-muted-foreground">
                        {tx.LineItems?.map((li: any) => (
                          <div key={li.id}>{li.supplier?.name || "-"}</div>
                        ))}
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="align-top text-right">
                    <Link href={`${prefix}/transactions/${tx.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                      <FileText className="w-4 h-4 mr-1" /> View
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {filteredTransactions.length > 0 && type !== "RETURN" && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={5} className="text-right font-bold">Total Filtered Value:</TableCell>
                <TableCell className="text-right font-bold text-emerald-600">₹{totalValue.toFixed(2)}</TableCell>
                {!isRent && <TableCell colSpan={3} />}
                {isSale && <TableCell />}
                <TableCell />
              </TableRow>
            </TableFooter>
          )}
          {filteredTransactions.length > 0 && type === "RETURN" && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={5} className="text-right font-bold">Total Absolute Return Value:</TableCell>
                <TableCell className="text-right font-bold text-amber-600">₹{Math.abs(totalValue).toFixed(2)}</TableCell>
                {!isRent && <TableCell colSpan={3} />}
                {isSale && <TableCell />}
                <TableCell />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  )
}
