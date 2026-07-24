"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EntityCombobox } from "@/components/shared/EntityCombobox"
import { TransactionType, PaymentStatus, LineItemType } from "@prisma/client"
import { createTransaction, updateTransaction, TransactionPayload, LineItemPayload } from "@/actions/accounting"
import { Plus, Trash2, Box, Hash, Package, FileText } from "lucide-react"
import { LineItemRow } from "./LineItemRow"
import { Textarea } from "@/components/ui/textarea"

type Customer = { id: string; name: string }
type Supplier = { id: string; name: string }
type Employee = { id: string; username: string }

export function TransactionForm({
  defaultType,
  customers,
  suppliers,
  employees,
  transaction,
  readOnlyCore,
  basePath
}: {
  defaultType: TransactionType
  customers: Customer[]
  suppliers: Supplier[]
  employees: Employee[]
  transaction?: any // if passed, we are in edit mode
  readOnlyCore?: boolean
  basePath?: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<TransactionType>(transaction?.type || defaultType)
  const [customerId, setCustomerId] = useState<string>(transaction?.customer_id || "")
  const [supplierId, setSupplierId] = useState<string>(transaction?.supplier_id || "")
  const [salespersonId, setSalespersonId] = useState<string>(transaction?.salesperson_id || "")
  
  const [lineItems, setLineItems] = useState<LineItemPayload[]>(transaction?.LineItems || [])
  
  const [amountPaid, setAmountPaid] = useState<number>(transaction?.amount_paid || 0)
  const [paymentAccount, setPaymentAccount] = useState<string>(transaction?.payment_account || "")
  const [remark, setRemark] = useState<string>(transaction?.remark || "")

  const isEdit = !!transaction

  // Compute total value based on line items
  const totalValue = lineItems.reduce((sum, item) => {
    if (item.type === "BUNDLE") {
      return sum + ((item.total_price || 0) * (item.quantity || 1))
    }
    const qty = item.type === "SERIALIZED" ? (item.serial_numbers?.length || 0) : (item.quantity || 0)
    return sum + ((item.price_per_unit || 0) * qty)
  }, 0)

  const pendingAmount = totalValue - amountPaid
  const paymentStatus: PaymentStatus = pendingAmount <= 0 && totalValue > 0 ? "PAID" : (amountPaid > 0 ? "PARTIAL" : "PENDING")

  const handleAddLineItem = (itemType: LineItemType) => {
    setLineItems([...lineItems, {
      type: itemType,
      category: "",
      item_model: "",
      serial_numbers: [],
      quantity: 1,
      price_per_unit: 0,
      bundle_name: "",
      bundle_components: [],
      total_price: 0
    }])
  }

  const updateLineItem = (index: number, updates: Partial<LineItemPayload>) => {
    const newItems = [...lineItems]
    newItems[index] = { ...newItems[index], ...updates }
    setLineItems(newItems)
  }

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        type,
        customer_id: customerId || undefined,
        supplier_id: supplierId || undefined,
        salesperson_id: salespersonId || undefined,
        total_value: totalValue,
        amount_paid: amountPaid,
        pending_amount: pendingAmount,
        payment_status: paymentStatus,
        payment_account: paymentAccount,
        remark: remark,
        line_items: lineItems
      }
      
      if (isEdit) {
        await updateTransaction(transaction.id, payload)
      } else {
        await createTransaction(payload)
      }
      
      const routeType = type === "REPAIR" ? "acc-repairs" : `${type.toLowerCase()}s`
      const prefix = basePath || "/accountant"
      router.push(`${prefix}/${routeType}`)
    } catch (error) {
      console.error(error)
      alert(`Failed to ${isEdit ? 'update' : 'create'} transaction.`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Details */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select disabled={readOnlyCore || isEdit} value={type} onValueChange={(v) => { if (v) setType(v as TransactionType) }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SALE">Sale</SelectItem>
                <SelectItem value="PURCHASE">Purchase</SelectItem>
                <SelectItem value="REPLACEMENT">Replacement</SelectItem>
                <SelectItem value="REPAIR">Repair</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(type === "SALE" || type === "REPAIR" || type === "REPLACEMENT") && (
            <div className="space-y-2">
              <Label>Customer (Optional)</Label>
              <EntityCombobox type="customer" value={customerId} onChange={setCustomerId} disabled={readOnlyCore} />
            </div>
          )}

          {(type === "PURCHASE" || type === "REPLACEMENT") && (
            <div className="space-y-2">
              <Label>Supplier (Optional)</Label>
              <EntityCombobox type="supplier" value={supplierId} onChange={setSupplierId} disabled={readOnlyCore} />
            </div>
          )}

          {type === "SALE" && (
            <div className="space-y-2 col-span-1 md:col-span-2">
              <Label>Salesperson (Optional)</Label>
              <Select disabled={readOnlyCore} value={salespersonId} onValueChange={(v) => { if (v) setSalespersonId(v) }}>
                <SelectTrigger><SelectValue placeholder="Select Salesperson" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.username}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Line Items</CardTitle>
          {!readOnlyCore && (
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => handleAddLineItem("SERIALIZED")}>
                <Hash className="h-4 w-4 mr-1" /> Serialized
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => handleAddLineItem("BULK")}>
                <Box className="h-4 w-4 mr-1" /> Bulk
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => handleAddLineItem("BUNDLE")}>
                <Package className="h-4 w-4 mr-1" /> Bundle
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {lineItems.length === 0 && (
            <p className="text-muted-foreground text-center py-4">No items added. Add items above.</p>
          )}

          {lineItems.map((item, index) => (
            <LineItemRow 
              key={index} 
              item={item} 
              index={index} 
              transactionType={type} 
              updateLineItem={updateLineItem} 
              removeLineItem={removeLineItem}
              readOnly={readOnlyCore}
            />
          ))}
        </CardContent>
      </Card>

      {/* Financials */}
      <Card>
        <CardHeader>
          <CardTitle>Financials</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex justify-between text-lg">
              <span>Total Value:</span>
              <span className="font-bold">₹{totalValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center bg-muted p-4 rounded-lg">
              <span className="font-medium text-lg">
                {type === "SALE" ? "Amount to Receive" : type === "PURCHASE" ? "Amount to Pay" : "Pending Amount"}
              </span>
              <span className={`text-xl font-bold ${pendingAmount > 0 ? "text-orange-600" : "text-green-600"}`}>
                ₹{pendingAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-lg">
              <span>Payment Status:</span>
              <Badge variant={paymentStatus === "PAID" ? "default" : paymentStatus === "PARTIAL" ? "secondary" : "destructive"}>{paymentStatus}</Badge>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount Paid</Label>
              <Input type="number" min="0" step="0.01" value={amountPaid} onChange={e => setAmountPaid(parseFloat(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Payment Account</Label>
              <Input value={paymentAccount} onChange={e => setPaymentAccount(e.target.value)} placeholder="e.g. HDFC Bank, Cash, etc." />
            </div>
            <div className="space-y-2">
              <Label>Remark</Label>
              <Textarea value={remark} onChange={e => setRemark(e.target.value)} placeholder="Any additional notes..." />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Transaction"}</Button>
      </div>
    </form>
  )
}
