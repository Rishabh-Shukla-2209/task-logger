"use client";

import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CallStatus } from "@prisma/client";
import { toast } from "sonner";
import { format, addDays } from "date-fns";

export function LogCallDialog({
  contactId,
  contactName,
  userId,
  onSuccess,
}: {
  contactId: string;
  contactName: string;
  userId: string;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [status, setStatus] = useState<CallStatus | "">("");
  const [remark, setRemark] = useState("");
  
  // Conditional fields
  const [requirement, setRequirement] = useState("");
  const [priceGiven, setPriceGiven] = useState("");
  const [priceAsked, setPriceAsked] = useState("");
  const [qty, setQty] = useState("");
  const [convertToCustomer, setConvertToCustomer] = useState(false);
  const [followupDate, setFollowupDate] = useState<string>(
    format(addDays(new Date(), 1), "yyyy-MM-dd") // Default to next day
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!status) return toast.error("Please select a status");
    if (status === "FOLLOW_UP" && !followupDate) return toast.error("Please select a follow-up date");

    setIsLoading(true);

    try {
      const res = await fetch("/api/calling/logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contact_id: contactId,
          user_id: userId,
          status,
          remark,
          requirement: status === "DIFFERENT_REQUIREMENT" ? requirement : undefined,
          price_given: status === "PRICING_ISSUE" ? priceGiven : undefined,
          price_asked: status === "PRICING_ISSUE" ? priceAsked : undefined,
          qty: status === "QTY_INSUFFICIENT" ? qty : undefined,
          followup_date: status === "FOLLOW_UP" ? followupDate : undefined,
          convertToCustomer: convertToCustomer,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to log call");
        setIsLoading(false);
        return;
      }

      setOpen(false);
      resetForm();
      toast.success("Call logged successfully!");
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while logging the call");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStatus("");
    setRemark("");
    setRequirement("");
    setPriceGiven("");
    setPriceAsked("");
    setQty("");
    setConvertToCustomer(false);
    setFollowupDate(format(addDays(new Date(), 1), "yyyy-MM-dd"));
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if(!val) resetForm(); }}>
      <DialogTrigger className={buttonVariants({ variant: "outline", size: "sm" })}>
        Log Call
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log Call with {contactName}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Call Status *</Label>
            <Select value={status} onValueChange={(val) => setStatus(val as CallStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
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

          {status === "FOLLOW_UP" && (
            <div className="space-y-2">
              <Label>Follow-up Date *</Label>
              <Input
                type="date"
                required
                value={followupDate}
                onChange={(e) => setFollowupDate(e.target.value)}
              />
            </div>
          )}

          {status === "DIFFERENT_REQUIREMENT" && (
            <div className="space-y-2">
              <Label>Client Requirement *</Label>
              <Input
                required
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
                placeholder="What exactly does the client need?"
              />
            </div>
          )}

          {status === "PRICING_ISSUE" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price Given *</Label>
                <Input
                  type="number"
                  required
                  value={priceGiven}
                  onChange={(e) => setPriceGiven(e.target.value)}
                  placeholder="e.g. 1000"
                />
              </div>
              <div className="space-y-2">
                <Label>Price Asked *</Label>
                <Input
                  type="number"
                  required
                  value={priceAsked}
                  onChange={(e) => setPriceAsked(e.target.value)}
                  placeholder="e.g. 800"
                />
              </div>
            </div>
          )}

          {status === "QTY_INSUFFICIENT" && (
            <div className="space-y-2">
              <Label>Quantity Needed *</Label>
              <Input
                type="number"
                required
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="e.g. 50"
              />
            </div>
          )}

          {status === "SOLD" && (
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="convertToCustomer" 
                checked={convertToCustomer} 
                onCheckedChange={(checked) => setConvertToCustomer(checked as boolean)} 
              />
              <Label htmlFor="convertToCustomer">Convert to Client / Customer</Label>
            </div>
          )}

          <div className="space-y-2">
            <Label>Remark</Label>
            <Textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Any additional notes..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !status}>
              {isLoading ? "Saving..." : "Save Log"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
