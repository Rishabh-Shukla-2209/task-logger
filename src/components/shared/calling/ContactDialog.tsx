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
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ContactDialog({
  employees,
  onSuccess,
}: {
  employees: {id: string, username: string}[];
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Basic Fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [dataOwnerId, setDataOwnerId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataOwnerId) return toast.error("Please select a Data Owner");
    
    setIsLoading(true);

    try {
      const res = await fetch("/api/calling/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          location,
          data_owner_id: dataOwnerId
          // Not handling customer_id linking directly here yet, but backend supports it
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to create contact");
        return;
      }

      setOpen(false);
      setName("");
      setPhone("");
      setLocation("");
      setDataOwnerId("");
      toast.success("Contact added successfully!");
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while creating the contact");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={buttonVariants()}>
        Add Contact
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 1234567890"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. New Delhi"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dataOwner">Data Owner *</Label>
            <Select value={dataOwnerId} onValueChange={(val) => setDataOwnerId(val as string)} required>
              <SelectTrigger id="dataOwner">
                <SelectValue placeholder="Select Data Owner">
                  {employees.find(e => e.id === dataOwnerId)?.username || "Select Data Owner"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.username}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !dataOwnerId}>
              {isLoading ? "Saving..." : "Save Contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
