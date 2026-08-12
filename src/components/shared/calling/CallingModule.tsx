"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ContactDialog } from "./ContactDialog";
import { LogCallDialog } from "./LogCallDialog";
import { Search } from "lucide-react";
import { CallStatus } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateFilter } from "@/components/DateFilter";
import { format } from "date-fns";
import { useSearchParams } from "next/navigation";

export function CallingModule({ userId }: { userId: string }) {
  const [activeTab, setActiveTab] = useState("contacts");
  
  // Contacts state
  const [contacts, setContacts] = useState<any[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  // History state
  const searchParams = useSearchParams();
  const startDateStr = searchParams.get("start");
  const endDateStr = searchParams.get("end");

  const [logs, setLogs] = useState<any[]>([]);
  const [summaryLogs, setSummaryLogs] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<CallStatus | "ALL">("ALL");
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const fetchContacts = useCallback(async () => {
    setIsLoadingContacts(true);
    try {
      const url = new URL("/api/calling/contacts", window.location.origin);
      if (contactSearch) {
        url.searchParams.set("search", contactSearch);
      }
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingContacts(false);
    }
  }, [contactSearch]);

  const fetchLogs = useCallback(async () => {
    setIsLoadingLogs(true);
    try {
      const url = new URL("/api/calling/logs", window.location.origin);
      if (statusFilter !== "ALL") {
        url.searchParams.set("status", statusFilter);
      }
      if (startDateStr) {
        url.searchParams.set("startDate", startDateStr);
      }
      if (endDateStr) {
        url.searchParams.set("endDate", endDateStr);
      }
      
      const summaryUrl = new URL("/api/calling/logs/summary", window.location.origin);
      if (startDateStr) summaryUrl.searchParams.set("startDate", startDateStr);
      if (endDateStr) summaryUrl.searchParams.set("endDate", endDateStr);
      
      const [res, summaryRes] = await Promise.all([
        fetch(url.toString()),
        fetch(summaryUrl.toString())
      ]);

      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
      
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummaryLogs(summaryData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [statusFilter, startDateStr, endDateStr]);

  useEffect(() => {
    if (activeTab === "contacts") {
      fetchContacts();
    } else if (activeTab === "history") {
      fetchLogs();
    }
  }, [activeTab, fetchContacts, fetchLogs]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchContacts();
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Client Calling</h2>
        <p className="text-muted-foreground">Manage your contacts and call logs here.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="history">Call History</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xl font-bold">Contacts List</CardTitle>
              <ContactDialog onSuccess={fetchContacts} />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 py-4">
                <form onSubmit={handleSearchSubmit} className="flex flex-1 max-w-sm space-x-2">
                  <Input
                    placeholder="Search name or phone..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                  />
                  <Button type="submit" size="icon" variant="outline">
                    <Search className="h-4 w-4" />
                  </Button>
                </form>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Added On</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingContacts ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                      </TableRow>
                    ) : contacts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">No contacts found</TableCell>
                      </TableRow>
                    ) : (
                      contacts.map((contact) => (
                        <TableRow key={contact.id}>
                          <TableCell className="font-medium">{contact.name}</TableCell>
                          <TableCell>{contact.phone}</TableCell>
                          <TableCell>{contact.location || "-"}</TableCell>
                          <TableCell>{format(new Date(contact.created_at), "dd/MM/yyyy")}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <LogCallDialog 
                                contactId={contact.id}
                                contactName={contact.name}
                                userId={userId}
                                onSuccess={() => {
                                  fetchContacts(); // Refresh contact list to show customer badge if converted
                                }}
                              />
                              <Link href={`/calling/${contact.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                                View History
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold">Call History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row justify-between items-center py-4 space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="w-full sm:w-[250px]">
                  <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as CallStatus | "ALL")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Statuses</SelectItem>
                      <SelectItem value="DID_NOT_ANSWER">Did not answer</SelectItem>
                      <SelectItem value="INVALID_CONTACT">Invalid/Not Reachable Contact</SelectItem>
                      <SelectItem value="SWITCHED_OFF">Switched Off</SelectItem>
                      <SelectItem value="SOLD">Sold</SelectItem>
                      <SelectItem value="FOLLOW_UP">Follow-up</SelectItem>
                      <SelectItem value="DO_NOT_CALL">Don&apos;t call again</SelectItem>
                      <SelectItem value="DIFFERENT_REQUIREMENT">Different Requirement</SelectItem>
                      <SelectItem value="PRICING_ISSUE">Pricing Issue</SelectItem>
                      <SelectItem value="QTY_INSUFFICIENT">Qty Insufficient</SelectItem>
                      <SelectItem value="NO_REQUIREMENT_RIGHT_NOW">No Requirement Right Now</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <DateFilter />
                </div>
              </div>

              <div className="rounded-md border mb-8 bg-card/50">
                <div className="p-4 border-b bg-muted/20">
                  <h3 className="font-semibold text-lg">Daily Summary</h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-center">Total Calls</TableHead>
                      <TableHead className="text-center">Sold</TableHead>
                      <TableHead className="text-center">Follow-up</TableHead>
                      <TableHead className="text-center">No Answer</TableHead>
                      <TableHead className="text-center">Invalid</TableHead>
                      <TableHead className="text-center">Switched Off</TableHead>
                      <TableHead className="text-center">Do Not Call</TableHead>
                      <TableHead className="text-center">Diff Req</TableHead>
                      <TableHead className="text-center">Pricing</TableHead>
                      <TableHead className="text-center">Qty Insuff</TableHead>
                      <TableHead className="text-center">No Req</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summaryLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center text-muted-foreground py-4">No summary data available</TableCell>
                      </TableRow>
                    ) : (
                      summaryLogs.map((sum) => (
                        <TableRow key={sum.date}>
                          <TableCell className="font-medium whitespace-nowrap">{format(new Date(sum.date), "dd/MM/yyyy")}</TableCell>
                          <TableCell className="text-center font-bold">{sum.total}</TableCell>
                          <TableCell className="text-center">{sum.SOLD}</TableCell>
                          <TableCell className="text-center">{sum.FOLLOW_UP}</TableCell>
                          <TableCell className="text-center">{sum.DID_NOT_ANSWER}</TableCell>
                          <TableCell className="text-center">{sum.INVALID_CONTACT}</TableCell>
                          <TableCell className="text-center">{sum.SWITCHED_OFF}</TableCell>
                          <TableCell className="text-center">{sum.DONT_CALL_AGAIN}</TableCell>
                          <TableCell className="text-center">{sum.DIFFERENT_REQUIREMENT}</TableCell>
                          <TableCell className="text-center">{sum.PRICING_ISSUE}</TableCell>
                          <TableCell className="text-center">{sum.QTY_INSUFFICIENT}</TableCell>
                          <TableCell className="text-center">{sum.NO_REQUIREMENT_RIGHT_NOW}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="rounded-md border">
                <div className="p-4 border-b bg-muted/20">
                  <h3 className="font-semibold text-lg">Detailed Call Logs</h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Caller</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingLogs ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                      </TableRow>
                    ) : logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">No call logs found</TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(log.created_at), "dd/MM/yyyy h:mm a")}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{log.contact?.name}</div>
                            <div className="text-sm text-muted-foreground">{log.contact?.phone}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={log.status === "SOLD" ? "default" : "secondary"}>
                              {formatStatus(log.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {log.remark && <div><span className="font-semibold">Remark:</span> {log.remark}</div>}
                              {log.requirement && <div><span className="font-semibold">Req:</span> {log.requirement}</div>}
                              {log.price_given !== null && <div><span className="font-semibold">Given:</span> {log.price_given}</div>}
                              {log.price_asked !== null && <div><span className="font-semibold">Asked:</span> {log.price_asked}</div>}
                              {log.qty !== null && <div><span className="font-semibold">Qty:</span> {log.qty}</div>}
                            </div>
                          </TableCell>
                          <TableCell>{log.user?.username}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
