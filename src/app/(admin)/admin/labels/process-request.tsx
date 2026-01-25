"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
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

interface ProcessLabelRequestProps {
  requestId: string;
}

export function ProcessLabelRequest({ requestId }: ProcessLabelRequestProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleProcess(status: "APPROVED" | "REJECTED" | "FULFILLED", labelUrl?: string) {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/labels/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, labelUrl }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to process request",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Request processed",
        description: `Label request has been ${status.toLowerCase()}.`,
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const labelUrl = formData.get("labelUrl") as string;
    await handleProcess("FULFILLED", labelUrl);
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="text-red-500 hover:text-red-600 hover:bg-red-50"
        onClick={() => handleProcess("REJECTED")}
        disabled={isLoading}
      >
        <X className="w-4 h-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
          >
            <Check className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fulfill Label Request</DialogTitle>
            <DialogDescription>
              Provide the shipping label URL to fulfill this request.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="labelUrl">Label URL</Label>
              <Input
                id="labelUrl"
                name="labelUrl"
                type="url"
                placeholder="https://example.com/label.pdf"
                required
              />
              <p className="text-xs text-muted-foreground">
                URL to the shipping label PDF or image
              </p>
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
                Fulfill Request
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
