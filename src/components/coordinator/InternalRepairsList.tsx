"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

export function InternalRepairsList({ repairs }: { repairs: any[] }) {
  const [search, setSearch] = useState("")
  const [outOnly, setOutOnly] = useState(false)
  const [vendorFilter, setVendorFilter] = useState("")

  const filtered = repairs.filter(r => {
    if (search && !r.item_description.toLowerCase().includes(search.toLowerCase())) return false
    if (outOnly && !["SENT_FOR_REPAIR", "RECEIVED_BACK"].includes(r.status)) return false
    if (vendorFilter && (!r.supplier || !r.supplier.name.toLowerCase().includes(vendorFilter.toLowerCase()))) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <Input 
          placeholder="Search items..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="max-w-sm"
        />
        <Input 
          placeholder="Filter by Vendor..." 
          value={vendorFilter} 
          onChange={(e) => setVendorFilter(e.target.value)} 
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <Checkbox id="outOnly" checked={outOnly} onCheckedChange={(c) => setOutOnly(!!c)} />
          <label htmlFor="outOnly" className="text-sm font-medium">Currently Out Only</label>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Repair Tickets</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Supplier/Vendor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">No repairs found.</TableCell>
                </TableRow>
              ) : (
                filtered.map((repair) => (
                  <TableRow key={repair.id}>
                    <TableCell className="font-medium">{repair.item_description}</TableCell>
                    <TableCell>{repair.supplier?.name || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{repair.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <a href={`/coordinator/repairs/${repair.id}`} className="text-indigo-600 hover:underline">View</a>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
