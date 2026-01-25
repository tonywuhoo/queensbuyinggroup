"use client";

import { useState, useEffect } from "react";
import { Truck, Package, Send, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Commitment {
  id: string;
  quantity: number;
  warehouse: string;
  status: string;
  deliveryMethod: string;
  deal: {
    title: string;
    payout: number;
  };
}

export default function SubmitTrackingPage() {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommitment, setSelectedCommitment] = useState<string>("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState<"FEDEX" | "UPS" | "USPS">("FEDEX");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCommitments = async () => {
      try {
        const res = await fetch('/api/commitments');
        if (res.ok) {
          const data = await res.json();
          // Only show shipping commitments that are pending
          setCommitments(data.filter((c: Commitment) => 
            c.deliveryMethod === 'SHIP' && c.status === 'PENDING'
          ));
        }
      } catch (e) {
        console.error('Error fetching commitments:', e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCommitments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommitment || !trackingNumber) return;

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commitmentId: selectedCommitment,
          trackingNumber,
          carrier
        })
      });

      if (res.ok) {
        setSuccess(true);
        setTrackingNumber("");
        setSelectedCommitment("");
        // Remove from list
        setCommitments(commitments.filter(c => c.id !== selectedCommitment));
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit tracking');
      }
    } catch (e) {
      console.error('Error submitting tracking:', e);
      setError('Failed to submit tracking');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCommitmentData = commitments.find(c => c.id === selectedCommitment);

  if (loading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-queens-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Submit Tracking</h1>
        <p className="text-slate-500 text-sm">Add tracking info for your shipped items</p>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-700">Tracking submitted successfully!</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
          <span className="text-red-700">{error}</span>
          <button onClick={() => setError("")} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {commitments.length > 0 ? (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6">
          {/* Select Commitment */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Commitment
            </label>
            <select
              value={selectedCommitment}
              onChange={(e) => setSelectedCommitment(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-queens-purple/20"
              required
            >
              <option value="">Choose a commitment...</option>
              {commitments.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.deal.title} - Qty: {c.quantity} - {c.warehouse}
                </option>
              ))}
            </select>
          </div>

          {/* Show selected commitment details */}
          {selectedCommitmentData && (
            <div className="mb-6 p-4 bg-slate-50 rounded-lg">
              <p className="font-medium text-slate-900">{selectedCommitmentData.deal.title}</p>
              <div className="flex gap-4 mt-2 text-sm text-slate-600">
                <span>Qty: {selectedCommitmentData.quantity}</span>
                <span>Warehouse: {selectedCommitmentData.warehouse}</span>
                <span className="text-green-600 font-medium">
                  ${(Number(selectedCommitmentData.deal.payout) * selectedCommitmentData.quantity).toLocaleString()} payout
                </span>
              </div>
            </div>
          )}

          {/* Carrier */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Carrier
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(["FEDEX", "UPS", "USPS"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCarrier(c)}
                  className={`p-3 rounded-lg border text-center font-medium transition-colors ${
                    carrier === c
                      ? "border-queens-purple bg-queens-purple/5 text-queens-purple"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Tracking Number */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tracking Number
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Enter tracking number"
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-queens-purple/20"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={!selectedCommitment || !trackingNumber || submitting}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            {submitting ? 'Submitting...' : 'Submit Tracking'}
          </Button>
        </form>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Truck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">No pending commitments to track</p>
          <p className="text-sm text-slate-400 mt-1">
            All your shipping commitments have tracking or are fulfilled
          </p>
        </div>
      )}
    </div>
  );
}
