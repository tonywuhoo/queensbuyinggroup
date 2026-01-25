"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface AddTrackingDialogProps {
  commitmentId: string;
}

export function AddTrackingDialog({ commitmentId }: AddTrackingDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const trackingNumber = formData.get("trackingNumber") as string;
    const trackingCarrier = formData.get("trackingCarrier") as string;

    try {
      const response = await fetch(`/api/commitments/${commitmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingNumber,
          trackingCarrier,
          status: "SHIPPED",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to update commitment",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Tracking added!",
        description: "Your commitment has been marked as shipped.",
      });

      setOpen(false);
      router.refresh();
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="purple" size="sm">
          <Truck className="w-4 h-4 mr-2" />
          Add Tracking
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Tracking Information</DialogTitle>
          <DialogDescription>
            Enter your shipping details to mark this commitment as shipped.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="trackingCarrier">Carrier (Optional)</Label>
            <Input
              id="trackingCarrier"
              name="trackingCarrier"
              placeholder="UPS, FedEx, USPS..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trackingNumber">Tracking Number</Label>
            <Input
              id="trackingNumber"
              name="trackingNumber"
              placeholder="1Z999AA10123456784"
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="purple" loading={isLoading}>
              Save & Mark Shipped
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
