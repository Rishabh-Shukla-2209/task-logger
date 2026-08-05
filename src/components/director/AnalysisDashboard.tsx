"use client"
import { useState, useEffect } from "react"
import { handleError } from "@/lib/errorHandler"
import { getSalesAnalysis, getPurchaseAnalysis, getReplacementAnalysis, getRepairAnalysis } from "@/actions/analysis"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SingleAnalysis } from "./SingleAnalysis"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2 } from "lucide-react"

export function AnalysisDashboard() {
  const [activeTab, setActiveTab] = useState("sales")
  
  // Group by states
  const [salesGroupBy, setSalesGroupBy] = useState<"customer" | "model" | "processor" | "generation" | "salesperson">("customer")
  const [purchaseGroupBy, setPurchaseGroupBy] = useState<"vendor" | "category" | "model" | "processor" | "generation">("vendor")
  const [replacementGroupBy, setReplacementGroupBy] = useState<"model" | "customer">("model")
  
  // Data states
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [activeTab, salesGroupBy, purchaseGroupBy, replacementGroupBy])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === "sales") {
        const res = await getSalesAnalysis(salesGroupBy)
        setData(res)
      } else if (activeTab === "purchases") {
        const res = await getPurchaseAnalysis(purchaseGroupBy)
        setData(res)
      } else if (activeTab === "replacements") {
        const res = await getReplacementAnalysis(replacementGroupBy)
        setData(res)
      } else if (activeTab === "repairs") {
        const res = await getRepairAnalysis()
        setData(res)
      }
    } catch (error) {
      handleError(error, "Failed to load analysis data")
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Accounting Transactions Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 h-auto mb-6">
            <TabsTrigger value="sales" className="py-2">Sales</TabsTrigger>
            <TabsTrigger value="purchases" className="py-2">Purchases</TabsTrigger>
            <TabsTrigger value="replacements" className="py-2">Replacements</TabsTrigger>
            <TabsTrigger value="repairs" className="py-2">Repairs</TabsTrigger>
            <TabsTrigger value="rent" className="py-2">Rent</TabsTrigger>
            <TabsTrigger value="returns" className="py-2">Returns</TabsTrigger>
          </TabsList>
          
          {(loading && ["sales", "purchases", "replacements", "repairs"].includes(activeTab)) && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && (
            <>
              <TabsContent value="sales" className="space-y-4">
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
              </TabsContent>

              <TabsContent value="purchases" className="space-y-4">
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
              </TabsContent>

              <TabsContent value="replacements" className="space-y-4">
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
              </TabsContent>

              <TabsContent value="repairs" className="space-y-4">
                {renderRepairTable()}
              </TabsContent>

              <TabsContent value="rent" className="space-y-4">
                <SingleAnalysis type="RENT" />
              </TabsContent>

              <TabsContent value="returns" className="space-y-4">
                <SingleAnalysis type="RETURN" />
              </TabsContent>
            </>
          )}
        </Tabs>
      </CardContent>
    </Card>
  )
}
