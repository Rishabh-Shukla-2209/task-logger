import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default async function ClientHistoryPage({ params }: { params: Promise<{ contactId: string }> }) {
  const { contactId } = await params;

  const contact = await prisma.callContact.findUnique({
    where: { id: contactId },
    include: {
      CallLogs: {
        orderBy: { created_at: "desc" },
        include: {
          user: {
            select: { username: true }
          }
        }
      }
    }
  });

  if (!contact) {
    notFound();
  }

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-4">
        <Link href="/sales/calling" className={buttonVariants({ variant: "ghost", size: "icon" })}>
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Client History</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-medium text-lg">{contact.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Phone</p>
            <p className="font-medium text-lg">{contact.phone}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Location</p>
            <p className="font-medium text-lg">{contact.location || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Status</p>
            <p className="font-medium text-lg">
              {contact.customer_id ? <Badge>Converted Customer</Badge> : <Badge variant="secondary">Lead</Badge>}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-xl font-bold">Call Timeline</h3>
        {contact.CallLogs.length === 0 ? (
          <p className="text-muted-foreground">No call logs recorded yet.</p>
        ) : (
          <div className="space-y-4">
            {contact.CallLogs.map(log => (
              <Card key={log.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="font-semibold">{format(new Date(log.created_at), "MMM d, yyyy h:mm a")}</div>
                  <Badge variant="outline">{formatStatus(log.status)}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">Caller: {log.user.username}</p>
                  
                  {log.remark && (
                    <div className="bg-muted/50 p-3 rounded-md mb-2">
                      <p className="text-sm italic">"{log.remark}"</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                    {log.requirement && (
                      <div className="col-span-2">
                        <span className="text-xs text-muted-foreground">Requirement:</span>
                        <p className="text-sm font-medium">{log.requirement}</p>
                      </div>
                    )}
                    {log.qty !== null && (
                      <div>
                        <span className="text-xs text-muted-foreground">Qty:</span>
                        <p className="text-sm font-medium">{log.qty}</p>
                      </div>
                    )}
                    {log.price_given !== null && (
                      <div>
                        <span className="text-xs text-muted-foreground">Price Given:</span>
                        <p className="text-sm font-medium">₹{log.price_given}</p>
                      </div>
                    )}
                    {log.price_asked !== null && (
                      <div>
                        <span className="text-xs text-muted-foreground">Price Asked:</span>
                        <p className="text-sm font-medium">₹{log.price_asked}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
