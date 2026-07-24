import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { Plus, IndianRupee, FileText } from "lucide-react"
import { TransactionType } from "@prisma/client"

export function TransactionList({
  transactions,
  type,
  title,
  description,
  basePath,
  analysisComponent
}: {
  transactions: any[],
  type: TransactionType,
  title: string,
  description: string,
  basePath?: string,
  analysisComponent?: React.ReactNode
}) {
  const prefix = basePath || '/accountant'
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {analysisComponent}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`${prefix}/transactions/new?type=${type}`}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> New {title.replace(/s$/, '')}
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4">
        {transactions.length === 0 ? (
          <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
            <p className="text-muted-foreground">No transactions found.</p>
          </div>
        ) : (
          transactions.map(tx => (
            <Card key={tx.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold ${tx.type === "SALE" ? "bg-green-100 text-green-700" :
                    tx.type === "PURCHASE" ? "bg-blue-100 text-blue-700" :
                      tx.type === "REPLACEMENT" ? "bg-purple-100 text-purple-700" :
                        "bg-orange-100 text-orange-700"
                    }`}>
                    {tx.type === "SALE" ? <IndianRupee className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">{tx.type}</h3>
                      <Badge variant={
                        tx.payment_status === "PAID" ? "default" :
                          tx.payment_status === "PARTIAL" ? "secondary" : "destructive"
                      }>
                        {tx.payment_status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tx.customer ? `Customer: ${tx.customer.name}` : tx.supplier ? `Supplier: ${tx.supplier.name}` : "General"}
                      {" • "}
                      {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="font-bold">₹{tx.total_value.toFixed(2)}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="font-bold text-red-600">₹{tx.pending_amount.toFixed(2)}</p>
                  </div>
                  <Link href={`${prefix}/transactions/${tx.id}`} className={buttonVariants({ variant: "outline" })}>
                    View Details
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
