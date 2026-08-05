import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function DirectorFollowupDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "DIRECTOR") {
    redirect("/")
  }

  const followup = await prisma.paymentFollowup.findUnique({
    where: { id },
    include: {
      Events: {
        orderBy: { created_at: "asc" },
        include: { user: { select: { username: true } } }
      }
    }
  })

  if (!followup) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/director/followups" />}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{followup.client_name}</h2>
          <p className="text-muted-foreground">Payment Followup Timeline</p>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Pending Amount</p>
            <p className="text-xl font-bold">₹{followup.pending_amount.toFixed(2)}</p>
          </div>
          <Badge variant={followup.status === "ACTIVE" ? "destructive" : "default"} className="text-lg py-1 px-4">
            {followup.status}
          </Badge>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {followup.Events.map((ev) => (
                  <div key={ev.id} className="relative pl-6 border-l-2 border-muted pb-6 last:pb-0">
                    <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1.5" />
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-semibold">{ev.action}</p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(ev.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">by {ev.user.username}</p>
                    {ev.amount_change !== null && (
                      <div className="mb-2 flex items-center gap-2">
                        <Badge variant={ev.amount_change > 0 ? "destructive" : "default"}>
                          {ev.amount_change > 0 ? "+" : ""}₹{ev.amount_change.toFixed(2)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          (₹{(ev.previous_amount || 0).toFixed(2)} ➔ ₹{((ev.previous_amount || 0) + ev.amount_change).toFixed(2)})
                        </span>
                      </div>
                    )}
                    {ev.remark && (
                      <div className="bg-muted/50 p-3 rounded-md text-sm whitespace-pre-wrap">
                        {ev.remark}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
