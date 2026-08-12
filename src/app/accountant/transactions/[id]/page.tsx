import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Pencil } from "lucide-react"
import { PrintButton } from "@/components/shared/PrintButton"
import { buttonVariants } from "@/components/ui/button"

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ACCOUNTANT") redirect("/")

  const tx = await prisma.transaction.findUnique({
    where: { id },
    include: {
      customer: true,
      supplier: true,
      salesperson: true,
      accountant: true,
      LineItems: true
    }
  })

  if (!tx) {
    return <div className="text-center py-20">Transaction not found.</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 print:w-full print:max-w-none">
      <div className="flex justify-between items-center print:hidden">
        <Link 
          href={`/accountant/${tx.type.toLowerCase()}s`}
          className={buttonVariants({ variant: "outline", size: "sm", className: "gap-2" })}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="flex gap-2">
          <Link 
            href={`/accountant/transactions/${tx.id}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm", className: "gap-2" })}
          >
            <Pencil className="h-4 w-4" /> Edit
          </Link>
          <PrintButton />
        </div>
      </div>

      <Card className="print:shadow-none print:border-none">
        <CardHeader className="border-b pb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold tracking-tight uppercase">{tx.type} INVOICE</h1>
              <p className="text-muted-foreground mt-1">ID: {tx.id}</p>
              <p className="text-muted-foreground">Date: {new Date(tx.created_at).toLocaleDateString("en-GB")}</p>
            </div>
            <div className="text-right">
              <Badge variant={
                tx.payment_status === "PAID" ? "default" :
                tx.payment_status === "PARTIAL" ? "secondary" : "destructive"
              } className="text-sm px-3 py-1">
                {tx.payment_status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-2">Billed To</h3>
              {tx.customer && (
                <div>
                  <p className="font-bold">{tx.customer.name}</p>
                  {tx.customer.phone && <p>{tx.customer.phone}</p>}
                  {tx.customer.address && <p className="whitespace-pre-wrap">{tx.customer.address}</p>}
                </div>
              )}
              {tx.supplier && (
                <div>
                  <p className="font-bold">{tx.supplier.name}</p>
                  {tx.supplier.contact && <p>{tx.supplier.contact}</p>}
                  {tx.supplier.address && <p className="whitespace-pre-wrap">{tx.supplier.address}</p>}
                </div>
              )}
              {!tx.customer && !tx.supplier && <p>General</p>}
            </div>
            <div className="text-right">
              <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-2">Details</h3>
              {tx.salesperson && <p>Salesperson: <strong>{tx.salesperson.username}</strong></p>}
              <p>Accountant: <strong>{tx.accountant.username}</strong></p>
              {tx.payment_account && <p>Payment A/C: <strong>{tx.payment_account}</strong></p>}
              {tx.remark && (
                <div className="mt-2">
                  <p className="font-semibold text-sm uppercase text-muted-foreground">Remark</p>
                  <p className="text-sm italic">{tx.remark}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-4">Line Items</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Type</th>
                    <th className="px-4 py-3 text-left font-medium">Description</th>
                    <th className="px-4 py-3 text-right font-medium">Qty</th>
                    <th className="px-4 py-3 text-right font-medium">Unit Price</th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tx.LineItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-medium">
                        <Badge variant="outline">{item.type}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {item.type === "BUNDLE" ? (
                          <div>
                            <p className="font-bold">{item.bundle_name}</p>
                            {item.bundle_components && (
                              <pre className="text-xs text-muted-foreground mt-1 bg-muted/50 p-2 rounded">
                                {typeof item.bundle_components === 'string' ? item.bundle_components : JSON.stringify(item.bundle_components, null, 2)}
                              </pre>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p>{item.category} - {item.item_model}</p>
                            {item.type === "SERIALIZED" && item.serial_numbers.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">SN: {item.serial_numbers.join(", ")}</p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.type === "SERIALIZED" ? item.serial_numbers.length : item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.type !== "BUNDLE" && item.price_per_unit ? `₹${item.price_per_unit.toFixed(2)}` : "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ₹{(item.total_price != null ? item.total_price : (item.type === "BUNDLE" ? (item.price_per_unit || 0) * (item.quantity || 1) : (item.price_per_unit || 0) * (item.type === "SERIALIZED" ? item.serial_numbers.length : (item.quantity || 1)))).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {tx.LineItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No items found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <div className="w-64 space-y-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Total Value:</span>
                <span>₹{tx.total_value.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Amount Paid:</span>
                <span className="text-green-600">₹{tx.amount_paid.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-red-600">
                <span>{tx.type === "SALE" ? "Amount to Receive:" : tx.type === "PURCHASE" ? "Amount to Pay:" : "Pending Amount:"}</span>
                <span>₹{tx.pending_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
