"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { Plus, IndianRupee, FileText } from "lucide-react"

export function SalesTable({
  transactions,
  basePath,
  analysisComponent
}: {
  transactions: any[],
  basePath?: string,
  analysisComponent?: React.ReactNode
}) {
  const prefix = basePath || '/accountant'

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {analysisComponent}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sales</h2>
          <p className="text-muted-foreground">Manage customer sales and payments.</p>
        </div>
        <Link href={`${prefix}/transactions/new?type=SALE`} className={buttonVariants({ variant: "default" })}>
          <Plus className="mr-2 h-4 w-4" /> Record Sale
        </Link>
      </div>

      <div className="border rounded-lg overflow-hidden bg-background">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Item Details</TableHead>
              <TableHead>Customer Name</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead className="text-right">Pending Amount</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                  No sales found.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="align-top whitespace-nowrap">
                    {new Date(tx.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="align-top">
                    <ul className="list-disc list-inside space-y-1">
                      {tx.LineItems?.map((li: any) => (
                        <li key={li.id}>{li.category || "Unknown"} ({li.quantity || li.serial_numbers?.length || 1})</li>
                      ))}
                    </ul>
                  </TableCell>
                  <TableCell className="align-top min-w-[250px]">
                    <ul className="list-disc list-inside space-y-2">
                      {tx.LineItems?.map((li: any) => {
                        const parts = []
                        if (li.make) parts.push(`Make: ${li.make}`)
                        if (li.item_model) parts.push(`Model: ${li.item_model}`)
                        if (li.serial_numbers && li.serial_numbers.length > 0) parts.push(`S/N: ${li.serial_numbers.join(", ")}`)
                        if (li.processor) parts.push(`Proc: ${li.processor}`)
                        if (li.generation) parts.push(`Gen: ${li.generation}`)
                        if (li.ram_gb) parts.push(`RAM: ${li.ram_gb}GB`)
                        if (li.ssd_gb) parts.push(`SSD: ${li.ssd_gb}GB`)
                        if (li.screen_size) parts.push(`Size: ${li.screen_size}`)
                        
                        return (
                          <li key={li.id} className="text-sm">
                            {parts.length > 0 ? parts.join(" | ") : (li.bundle_name || "No details")}
                          </li>
                        )
                      })}
                    </ul>
                  </TableCell>
                  <TableCell className="align-top font-medium">
                    {tx.customer?.name || "N/A"}
                  </TableCell>
                  <TableCell className="align-top text-right font-medium text-emerald-600 whitespace-nowrap">
                    ₹{tx.total_value.toFixed(2)}
                  </TableCell>
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
                  <TableCell className="align-top">
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {tx.LineItems?.map((li: any) => (
                        <li key={li.id}>{li.supplier?.name || "-"}</li>
                      ))}
                    </ul>
                  </TableCell>
                  <TableCell className="align-top text-right">
                    <Link href={`${prefix}/transactions/${tx.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                      <FileText className="w-4 h-4 mr-1" /> View
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
