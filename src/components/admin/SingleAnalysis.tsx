"use client"
import { useState, useEffect } from "react"
import { getSalesAnalysis, getPurchaseAnalysis, getReplacementAnalysis, getRepairAnalysis } from "@/actions/analysis"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, ChevronDown, ChevronUp, BarChart } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export function SingleAnalysis({ type }: { type: "SALE" | "PURCHASE" | "REPLACEMENT" | "REPAIR" }) {
  const [isOpen, setIsOpen] = useState(false)
  
  const [salesGroupBy, setSalesGroupBy] = useState<"customer" | "model" | "processor" | "generation" | "salesperson">("customer")
  const [purchaseGroupBy, setPurchaseGroupBy] = useState<"vendor" | "category" | "model" | "processor" | "generation">("vendor")
  const [replacementGroupBy, setReplacementGroupBy] = useState<"model" | "customer">("model")
  
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) fetchData()
  }, [isOpen, salesGroupBy, purchaseGroupBy, replacementGroupBy])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (type === "SALE") setData(await getSalesAnalysis(salesGroupBy))
      else if (type === "PURCHASE") setData(await getPurchaseAnalysis(purchaseGroupBy))
      else if (type === "REPLACEMENT") setData(await getReplacementAnalysis(replacementGroupBy))
      else if (type === "REPAIR") setData(await getRepairAnalysis())
    } catch (error) {
      console.error(error)
      setData([])
    }
    setLoading(false)
  }

  const renderAggregateTable = (columns: { key: string, label: string }[]) => (
    <div className="border rounded-lg overflow-hidden bg-background">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            {columns.map(col => (
              <TableHead key={col.key}>{col.label}</TableHead>
            ))}
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Total Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + 2} className="text-center py-8 text-muted-foreground">
                No data available for this analysis.
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{row.name || "N/A"}</TableCell>
                <TableCell className="text-right">{row.quantity}</TableCell>
                <TableCell className="text-right font-medium">₹{(row.total_value || 0).toFixed(2)}</TableCell>
              </TableRow>
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
              </>
            )}

          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  )
}
