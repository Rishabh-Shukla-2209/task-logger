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
import { TransactionType, PaymentStatus, LineItemType, ReturnType } from "@prisma/client"
import { createTransaction, updateTransaction, deleteTransaction, TransactionPayload, LineItemPayload } from "@/actions/accounting"
import { Plus, Trash2, Box, Hash, Package, FileText } from "lucide-react"
import { LineItemRow } from "./LineItemRow"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Customer = { id: string; name: string }
type Supplier = { id: string; name: string }
type Employee = { id: string; username: string }

import { handleError } from "@/lib/errorHandler"

export function TransactionForm({
  defaultType,
  customers,
  suppliers,
  employees,
  transaction,
  readOnlyCore,
  basePath,
  options
}: {
  defaultType: TransactionType
  customers: Customer[]
  suppliers: Supplier[]
  employees: Employee[]
  transaction?: any
  readOnlyCore?: boolean
  basePath?: string
  options?: any
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

  const [date, setDate] = useState<string>(transaction?.created_at ? new Date(transaction.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
  const [rentStartDate, setRentStartDate] = useState<string>(transaction?.rent_start_date ? new Date(transaction.rent_start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
  const [returnType, setReturnType] = useState<ReturnType>(transaction?.return_type || "SALE")
  
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const isEdit = !!transaction

  const totalValue = lineItems.reduce((sum, item) => {
    if (item.type === "BUNDLE") {
      return sum + ((item.total_price || 0) * (item.quantity || 1))
    }
    const qty = item.type === "SERIALIZED" ? (item.serial_numbers?.map(s => s.trim()).filter(Boolean).length || 0) : (item.quantity || 0)
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
    setFormError(null)

    if (type === "SALE" && !customerId) {
      setFormError("Customer is mandatory for a Sale transaction.")
      setLoading(false)
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }
    if (type === "SALE" && !supplierId) {
      setFormError("Source (Supplier) is mandatory for a Sale transaction.")
      setLoading(false)
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }
    if (type === "SALE" && (!salespersonId || salespersonId === "none")) {
      setFormError("Salesperson is mandatory for a Sale transaction.")
      setLoading(false)
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }
    if (lineItems.length === 0) {
      setFormError("At least one line item is required.")
      setLoading(false)
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    try {
      const payload = {
        type,
        customer_id: customerId || undefined,
        supplier_id: supplierId || undefined,
        salesperson_id: salespersonId || undefined,
        total_value: totalValue,
        amount_paid: type === "RENT" ? totalValue : amountPaid,
        pending_amount: type === "RENT" ? 0 : pendingAmount,
        payment_status: type === "RENT" ? "PAID" as PaymentStatus : paymentStatus,
        payment_account: paymentAccount,
        remark: remark,
        created_at: date ? new Date(`${date}T00:00:00.000Z`) : undefined,
        rent_start_date: (type === "RENT" && rentStartDate) ? new Date(`${rentStartDate}T00:00:00.000Z`) : undefined,
        return_type: type === "RETURN" ? returnType : undefined,
        line_items: lineItems.map(item => ({
          ...item,
          serial_numbers: item.serial_numbers?.map(s => s.trim()).filter(Boolean) || [],
          mis_numbers: item.mis_numbers?.map(s => s.trim()).filter(Boolean) || []
        }))
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
      handleError(error, `Failed to ${isEdit ? 'update' : 'create'} transaction.`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      if (transaction?.id) {
        await deleteTransaction(transaction.id)
      }
      const routeType = type === "REPAIR" ? "acc-repairs" : `${type.toLowerCase()}s`
      const prefix = basePath || "/accountant"
      router.push(`${prefix}/${routeType}`)
    } catch (error) {
      handleError(error, "Failed to delete transaction.")
      setLoading(false)
      setDeleteDialogOpen(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {formError && (
        <div className="bg-destructive/15 text-destructive border border-destructive/20 p-4 rounded-md text-sm font-medium">
          {formError}
        </div>
      )}

      {/* Basic Details */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Transaction Date</Label>
            <Input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              disabled={readOnlyCore}
              max={new Date().toISOString().split('T')[0]} 
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select disabled={readOnlyCore} value={type} onValueChange={(v) => { if (v) setType(v as TransactionType) }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SALE">Sale</SelectItem>
                <SelectItem value="PURCHASE">Purchase</SelectItem>
                <SelectItem value="REPLACEMENT">Replacement</SelectItem>
                <SelectItem value="REPAIR">Repair</SelectItem>
                <SelectItem value="RENT">Rent</SelectItem>
                <SelectItem value="RETURN">Return</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === "RETURN" && (
            <div className="space-y-2">
              <Label>Return Type</Label>
              <Select disabled={readOnlyCore} value={returnType} onValueChange={(v) => { if (v) setReturnType(v as ReturnType) }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SALE">Sale Return</SelectItem>
                  <SelectItem value="RENT">Rent Return</SelectItem>
                  <SelectItem value="PURCHASE">Purchase Return</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {type === "RENT" && (
            <div className="space-y-2">
              <Label>Rent Start Date</Label>
              <Input 
                type="date" 
                value={rentStartDate} 
                onChange={(e) => setRentStartDate(e.target.value)} 
                disabled={readOnlyCore}
              />
            </div>
          )}

          {(type === "SALE" || type === "REPAIR" || type === "REPLACEMENT" || type === "RENT" || (type === "RETURN" && (returnType === "SALE" || returnType === "RENT"))) && (
            <div className="space-y-2">
              <Label>Customer (Optional)</Label>
              <EntityCombobox type="customer" value={customerId} onChange={setCustomerId} disabled={readOnlyCore} />
            </div>
          )}

          {(type === "PURCHASE" || type === "REPLACEMENT" || type === "SALE" || (type === "RETURN" && returnType === "PURCHASE")) && (
            <div className="space-y-2">
              <Label>{type === "SALE" ? "Source (Supplier)" : "Supplier (Optional)"}</Label>
              <EntityCombobox type="supplier" value={supplierId} onChange={setSupplierId} disabled={readOnlyCore} />
            </div>
          )}

          {type === "SALE" && (
            <div className="space-y-2 col-span-1 md:col-span-2">
              <Label>Salesperson</Label>
              <Select disabled={readOnlyCore} value={salespersonId} onValueChange={(v) => { if (v) setSalespersonId(v) }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Salesperson">
                    {salespersonId && salespersonId !== "none" ? employees.find(e => e.id === salespersonId)?.username : (salespersonId === "none" ? "None" : undefined)}
                  </SelectValue>
                </SelectTrigger>
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
              options={options}
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
              <span>{type === "RENT" ? "Rental Amount:" : "Total Value:"}</span>
              <span className="font-bold">₹{totalValue.toFixed(2)}</span>
            </div>
            {type !== "RENT" && (
              <>
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
              </>
            )}
          </div>
          
          <div className="space-y-4">
            {type !== "RENT" && (
              <div className="space-y-2">
                <Label>Amount Paid</Label>
                <Input type="number" min="0" step="0.01" value={amountPaid} onChange={e => setAmountPaid(parseFloat(e.target.value))} />
              </div>
            )}
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

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 w-full">
        <div>
          {isEdit && !readOnlyCore && (
            <Button type="button" variant="destructive" onClick={() => setDeleteDialogOpen(true)} disabled={loading}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
        <div className="flex flex-col md:flex-row justify-end items-end md:items-center gap-4 flex-1">
          {formError && (
            <div className="text-destructive text-sm font-medium animate-in fade-in slide-in-from-right-4">
              {formError}
            </div>
          )}
          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Transaction"}</Button>
          </div>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={loading}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}
