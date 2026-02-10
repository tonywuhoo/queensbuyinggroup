"use client";

import { useState, useEffect } from "react";
import { Truck, Send, CheckCircle, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { detectCarrier, getCarrierInfo, type Carrier } from "@/lib/carrier-detection";

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
  const [detectedCarrier, setDetectedCarrier] = useState<Carrier>("UNKNOWN");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  
  // Auto-detect carrier when tracking number changes
  useEffect(() => {
    if (trackingNumber.length >= 8) {
      const carrier = detectCarrier(trackingNumber);
      setDetectedCarrier(carrier);
    } else {
      setDetectedCarrier("UNKNOWN");
    }
  }, [trackingNumber]);

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
    
    if (detectedCarrier === "UNKNOWN") {
      setError("Unable to detect carrier from tracking number. Please verify the tracking number is correct.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commitmentId: selectedCommitment,
          trackingNumber: trackingNumber.replace(/[\s-]/g, "").toUpperCase(),
          carrier: detectedCarrier
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

          {/* Tracking Number */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tracking Number
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Enter tracking number (e.g., 1Z999AA10123456784)"
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-queens-purple/20"
              required
            />
            <p className="text-xs text-slate-400 mt-1">
              Carrier is automatically detected from the tracking number format
            </p>
          </div>

          {/* Auto-Detected Carrier */}
          {trackingNumber.length >= 8 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Detected Carrier
              </label>
              {detectedCarrier !== "UNKNOWN" ? (
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-medium ${getCarrierInfo(detectedCarrier).color}`}>
                  <CheckCircle className="w-4 h-4" />
                  {getCarrierInfo(detectedCarrier).name}
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-orange-200 bg-orange-50 text-orange-700">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">
                    Unable to detect carrier. Please verify the tracking number is correct.
                  </span>
                </div>
              )}
            </div>
          )}

          <Button
            type="submit"
            disabled={!selectedCommitment || !trackingNumber || detectedCarrier === "UNKNOWN" || submitting}
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
