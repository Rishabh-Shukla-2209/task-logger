"use client"
import React, { useState, useEffect } from "react"
import { handleError } from "@/lib/errorHandler"
import { getSalesAnalysis, getPurchaseAnalysis, getReplacementAnalysis, getRepairAnalysis, getSalesAnalysisDetails, getRentAnalysis, getReturnAnalysis } from "@/actions/analysis"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, ChevronDown, ChevronUp, BarChart } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export function SingleAnalysis({
  type,
  startDate,
  endDate
}: {
  type: "SALE" | "PURCHASE" | "REPLACEMENT" | "REPAIR" | "RENT" | "RETURN",
  startDate?: Date,
  endDate?: Date
}) {
  const [isOpen, setIsOpen] = useState(false)

  const [salesGroupBy, setSalesGroupBy] = useState<"customer" | "model" | "processor" | "generation" | "salesperson" | "category" | "pending_payment" | "source">("customer")
  const [purchaseGroupBy, setPurchaseGroupBy] = useState<"vendor" | "category" | "model" | "processor" | "generation">("vendor")
  const [replacementGroupBy, setReplacementGroupBy] = useState<"model" | "customer">("model")

  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
  const [detailsData, setDetailsData] = useState<any[]>([])
  const [detailsLoading, setDetailsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) fetchData()
  }, [isOpen, salesGroupBy, purchaseGroupBy, replacementGroupBy, startDate, endDate])

  const fetchData = async () => {
    setLoading(true)
    setExpandedRowId(null)
    try {
      if (type === "SALE") setData(await getSalesAnalysis(salesGroupBy, startDate, endDate))
      else if (type === "PURCHASE") setData(await getPurchaseAnalysis(purchaseGroupBy, startDate, endDate))
      else if (type === "REPLACEMENT") setData(await getReplacementAnalysis(replacementGroupBy, startDate, endDate))
      else if (type === "REPAIR") setData(await getRepairAnalysis(startDate, endDate))
      else if (type === "RENT") setData(await getRentAnalysis(startDate, endDate))
      else if (type === "RETURN") setData(await getReturnAnalysis(startDate, endDate))
    } catch (error) {
      handleError(error, "Failed to load analysis data")
      setData([])
    }
    setLoading(false)
  }

  const toggleRow = async (rowName: string) => {
    if (expandedRowId === rowName) {
      setExpandedRowId(null)
      setDetailsData([])
      return
    }
    setExpandedRowId(rowName)
    setDetailsLoading(true)
    try {
      const details = await getSalesAnalysisDetails(salesGroupBy, rowName, startDate, endDate)
      setDetailsData(details)
    } catch (e) {
      handleError(e, "Failed to load details data")
    }
    setDetailsLoading(false)
  }

  const renderDetailsTable = (groupBy: string) => {
    if (detailsData.length === 0) {
      return <div className="text-center text-sm text-muted-foreground py-4">No detailed records found.</div>
    }

    let detailCols: string[] = []
    if (groupBy === "customer") detailCols = ["Type", "Make", "Model", "RAM", "SSD", "Processor", "Generation", "Rate"]
    else if (groupBy === "model") detailCols = ["RAM", "SSD", "Processor", "Generation", "Rate"]
    else if (groupBy === "processor") detailCols = ["Generation"]
    else if (groupBy === "generation") detailCols = ["Processor"]
    else if (groupBy === "salesperson") detailCols = ["Type", "Make", "Model"]
    else if (groupBy === "category") detailCols = ["Make", "Model"]
    else if (groupBy === "pending_payment") detailCols = ["Date", "Customer Name", "Item Details", "Rate", "Payment Info"]

    return (
      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              {detailCols.map(col => <TableHead key={col} className="h-8 py-1">{col}</TableHead>)}
              <TableHead className="text-right h-8 py-1">Quantity</TableHead>
              <TableHead className="text-right h-8 py-1">Pending Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detailsData.map((d, idx) => (
              <TableRow key={idx}>
                {groupBy === "customer" && (
                  <>
                    <TableCell className="py-2">{d.type}</TableCell>
                    <TableCell className="py-2">{d.make}</TableCell>
                    <TableCell className="py-2">{d.model}</TableCell>
                    <TableCell className="py-2">{d.ram}</TableCell>
                    <TableCell className="py-2">{d.ssd}</TableCell>
                    <TableCell className="py-2">{d.processor}</TableCell>
                    <TableCell className="py-2">{d.generation}</TableCell>
                    <TableCell className="py-2">₹{d.rate.toFixed(2)}</TableCell>
                  </>
                )}
                {groupBy === "model" && (
                  <>
                    <TableCell className="py-2">{d.ram}</TableCell>
                    <TableCell className="py-2">{d.ssd}</TableCell>
                    <TableCell className="py-2">{d.processor}</TableCell>
                    <TableCell className="py-2">{d.generation}</TableCell>
                    <TableCell className="py-2">₹{d.rate.toFixed(2)}</TableCell>
                  </>
                )}
                {groupBy === "processor" && <TableCell className="py-2">{d.generation}</TableCell>}
                {groupBy === "generation" && <TableCell className="py-2">{d.processor}</TableCell>}
                {groupBy === "salesperson" && (
                  <>
                    <TableCell className="py-2">{d.type}</TableCell>
                    <TableCell className="py-2">{d.make}</TableCell>
                    <TableCell className="py-2">{d.model}</TableCell>
                  </>
                )}
                {groupBy === "category" && (
                  <>
                    <TableCell className="py-2">{d.make}</TableCell>
                    <TableCell className="py-2">{d.model}</TableCell>
                  </>
                )}
                {groupBy === "pending_payment" && (
                  <>
                    <TableCell className="py-2 align-top">{d.date}</TableCell>
                    <TableCell className="py-2 align-top font-medium">{d.customerName}</TableCell>
                    <TableCell className="py-2 align-top min-w-[250px]">
                      <div className="flex flex-col space-y-3">
                        {d.items?.map((li: any) => {
                          const parts = []
                          if (li.make) parts.push(li.make)
                          if (li.item_model) parts.push(li.item_model)
                          if (li.processor) parts.push(li.processor)
                          if (li.generation) parts.push(li.generation)
                          if (li.ram_gb) parts.push(`${li.ram_gb}GB`)
                          if (li.ssd_gb) parts.push(`${li.ssd_gb}GB`)
                          return (
                            <div key={li.id} className="text-sm font-medium">
                              {parts.length > 0 ? parts.join(" | ") : (li.bundle_name || li.category || "No details")}
                            </div>
                          )
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 align-top">
                      <div className="flex flex-col space-y-3">
                        {d.items?.map((li: any) => (
                          <div key={li.id} className="text-sm">₹{(li.price_per_unit || 0).toFixed(2)}</div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 align-top">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">{d.paymentStatus}</span>
                        <span className="text-xs text-muted-foreground">{d.paymentAccount}</span>
                      </div>
                    </TableCell>
                  </>
                )}

                <TableCell className="text-right py-2 align-top">{d.quantity}</TableCell>
                <TableCell className="text-right font-medium text-emerald-600 py-2 align-top">₹{(d.amount || 0).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  const renderAggregateTable = (columns: { key: string, label: string }[]) => (
    <div className="border rounded-lg overflow-hidden bg-background">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            {type === "SALE" && <TableHead className="w-12"></TableHead>}
            {columns.map(col => (
              <TableHead key={col.key}>{col.label}</TableHead>
            ))}
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">{salesGroupBy === "pending_payment" ? "Pending Amount" : "Total Value"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={type === "SALE" ? columns.length + 3 : columns.length + 2} className="text-center py-8 text-muted-foreground">
                No data available for this analysis.
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, i) => (
              <React.Fragment key={i}>
                <TableRow
                  className={type === "SALE" ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}
                  onClick={() => type === "SALE" && toggleRow(row.name)}
                >
                  {type === "SALE" && (
                    <TableCell className="w-12">
                      {expandedRowId === row.name ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </TableCell>
                  )}
                  <TableCell className="font-medium">{row.name || "N/A"}</TableCell>
                  <TableCell className="text-right">{row.quantity}</TableCell>
                  <TableCell className="text-right font-medium text-emerald-600">₹{(row.total_value || 0).toFixed(2)}</TableCell>
                </TableRow>
                {type === "SALE" && expandedRowId === row.name && (
                  <TableRow className="bg-muted/20">
                    <TableCell colSpan={columns.length + 3} className="p-0 border-b">
                      {detailsLoading ? (
                        <div className="flex justify-center items-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="p-4 border-l-4 border-l-primary/40 bg-muted/5">
                          {renderDetailsTable(salesGroupBy)}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )

  const renderRepairTable = () => (
    <div className="border rounded-lg overflow-hidden bg-background">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Category / Model</TableHead>
            <TableHead>Defect</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Repair Cost</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No repair records found.
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, i) => (
              <TableRow key={i}>
                <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                <TableCell>{row.customer}</TableCell>
                <TableCell>
                  <div className="font-medium">{row.category}</div>
                  <div className="text-xs text-muted-foreground">{row.model}</div>
                </TableCell>
                <TableCell>{row.defect}</TableCell>
                <TableCell className="text-right">{row.quantity}</TableCell>
                <TableCell className="text-right font-medium text-rose-600">₹{(row.repair_cost || 0).toFixed(2)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold tracking-tight">Analysis Dashboard</h2>
        <CollapsibleTrigger className={buttonVariants({ variant: "outline", size: "sm" }) + " gap-2"}>

          <BarChart className="w-4 h-4" />
          {isOpen ? "Hide Analysis" : "Show Analysis"}
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}

        </CollapsibleTrigger>
      </div>

      <CollapsibleContent>
        <Card className="w-full">
          <CardContent className="pt-6 space-y-4">

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {type === "SALE" && (
                  <>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">Analyze by:</span>
                      <Select value={salesGroupBy} onValueChange={(v: any) => setSalesGroupBy(v)}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select grouping" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="customer">Customer</SelectItem>
                          <SelectItem value="model">Model</SelectItem>
                          <SelectItem value="processor">Processor</SelectItem>
                          <SelectItem value="generation">Generation</SelectItem>
                          <SelectItem value="salesperson">Salesperson</SelectItem>
                          <SelectItem value="category">Category</SelectItem>
                          <SelectItem value="pending_payment">Pending Payment</SelectItem>
                          <SelectItem value="source">Source (Supplier)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {renderAggregateTable([{ key: "name", label: salesGroupBy.charAt(0).toUpperCase() + salesGroupBy.slice(1) }])}
                  </>
                )}

                {type === "PURCHASE" && (
                  <>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">Analyze by:</span>
                      <Select value={purchaseGroupBy} onValueChange={(v: any) => setPurchaseGroupBy(v)}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select grouping" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vendor">Vendor</SelectItem>
                          <SelectItem value="category">Item Category</SelectItem>
                          <SelectItem value="model">Model</SelectItem>
                          <SelectItem value="processor">Processor</SelectItem>
                          <SelectItem value="generation">Generation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {renderAggregateTable([{ key: "name", label: purchaseGroupBy.charAt(0).toUpperCase() + purchaseGroupBy.slice(1) }])}
                  </>
                )}

                {type === "REPLACEMENT" && (
                  <>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">Analyze by:</span>
                      <Select value={replacementGroupBy} onValueChange={(v: any) => setReplacementGroupBy(v)}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select grouping" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="model">Model</SelectItem>
                          <SelectItem value="customer">Customer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {renderAggregateTable([{ key: "name", label: replacementGroupBy.charAt(0).toUpperCase() + replacementGroupBy.slice(1) }])}
                  </>
                )}

                {type === "REPAIR" && renderRepairTable()}

                {type === "RENT" && renderAggregateTable([{ key: "name", label: "Customer" }])}

                {type === "RETURN" && renderAggregateTable([{ key: "name", label: "Return Type" }])}
              </>
            )}

          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  )
}
