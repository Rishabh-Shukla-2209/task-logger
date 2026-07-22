import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Check, Clock } from "lucide-react"
import { updateWarrantyStatus } from "@/actions/warranty"

export default async function WarrantyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions)
  if (!session || !["COORDINATOR", "MANAGER", "ADMIN"].includes(session.user.role)) redirect("/")
  
  const isReadOnly = session.user.role !== "COORDINATOR"

  const warranty = await prisma.warrantyExchange.findUnique({
    where: { id: id },
  })

  if (!warranty) redirect("/coordinator/warranty")

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/coordinator/warranty">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Warranty Claims
          </Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Warranty Claim</h2>
      </div>

      <div className="bg-card p-6 rounded-lg border shadow-sm grid md:grid-cols-2 gap-6">
        <div>
          <p className="text-sm text-muted-foreground">Supplier / Customer</p>
          <p className="font-semibold text-lg">{warranty.customer_name}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Device Details</p>
          <p className="font-semibold text-lg">{warranty.device_details}</p>
        </div>
        <div className="md:col-span-2">
          <p className="text-sm text-muted-foreground">Issue / Reason</p>
          <p className="font-semibold">{warranty.reason}</p>
        </div>
        
        <div className="md:col-span-2 mt-4 p-4 bg-muted/30 rounded-md border flex items-center justify-between">
          <div>
            <h4 className="font-semibold mb-1">Status</h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {warranty.status === "ADDED" ? (
                <><Clock className="w-4 h-4 text-amber-500" /> Currently Added / Processing</>
              ) : (
                <><Check className="w-4 h-4 text-green-500" /> Warranty Claimed Successfully</>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Last updated: {new Date(warranty.updated_at).toLocaleString()}
            </p>
          </div>
          
          {warranty.status === "ADDED" && !isReadOnly && (
            <form action={async () => {
              "use server"
              await updateWarrantyStatus(warranty.id, "WARRANTY_CLAIMED")
            }}>
              <Button type="submit" variant="default" className="bg-green-600 hover:bg-green-700">
                Mark as Claimed
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
