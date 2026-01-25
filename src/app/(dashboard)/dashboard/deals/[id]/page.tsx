"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Package, AlertCircle, CheckCircle, Clock, Tag, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Deal {
  id: string;
  dealId: string;
  title: string;
  description: string;
  retailPrice: number;
  payout: number;
  priceType: string;
  status: string;
  limitPerVendor?: number;
  freeLabelMin?: number;
  deadline?: string;
  imageUrl?: string;
}

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;
  
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDeal = async () => {
      try {
        const res = await fetch(`/api/deals/${dealId}`);
        if (res.ok) {
          const data = await res.json();
          setDeal(data);
        } else {
          setDeal(null);
        }
      } catch (e) {
        console.error('Error fetching deal:', e);
        setDeal(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDeal();
  }, [dealId]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-queens-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="p-8 text-center">
        <Package className="w-16 h-16 mx-auto mb-4 text-slate-300" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Deal not found</h1>
        <p className="text-slate-500 mb-4">This deal may have been removed or expired.</p>
        <Link href="/dashboard/deals">
          <Button variant="purple">Back to Deals</Button>
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setError("");
    
    try {
      const res = await fetch('/api/commitments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: deal.id,
          quantity: Number(quantity),
        })
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create commitment');
      }
    } catch (e) {
      setError('Failed to create commitment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const retailNum = Number(deal.retailPrice);
  const payoutNum = Number(deal.payout);
  const profit = payoutNum - retailNum;
  const percent = ((payoutNum / retailNum) * 100).toFixed(1);
  const isAbove = deal.priceType === "ABOVE_RETAIL";
  const isRetail = deal.priceType === "RETAIL";
  
  const estimatedPayout = Number(quantity) * payoutNum;
  const qualifiesForFreeLabel = deal.freeLabelMin ? Number(quantity) >= deal.freeLabelMin : false;

  if (success) {
    return (
      <div className="p-8">
        <div className="max-w-lg mx-auto text-center py-12">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Commitment Created!</h1>
          <p className="text-slate-500 mb-6">
            You've committed to {quantity} units of {deal.title}.
          </p>
          <div className="p-4 bg-slate-50 rounded-xl mb-6 text-left">
            <p className="font-medium text-slate-900 mb-2">Next Steps:</p>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Go to My Commitments</li>
              <li>• Choose delivery method (Ship or Drop-off)</li>
              <li>• Select your warehouse</li>
              <li>• Request a label or submit tracking</li>
            </ul>
          </div>
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard/commitments">
              <Button variant="purple">Go to My Commitments</Button>
            </Link>
            <Link href="/dashboard/deals">
              <Button variant="outline">Browse More Deals</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Back button */}
      <Link href="/dashboard/deals" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Deals
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Deal Info */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Image */}
            <div className="w-full h-48 lg:h-64 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center relative">
              <Package className="w-24 h-24 text-slate-200" />
              <div className="absolute top-4 left-4">
                <span className="text-xs font-mono bg-queens-purple/10 text-queens-purple px-2 py-1 rounded">
                  {deal.dealId}
                </span>
              </div>
              <Badge className={`absolute top-4 right-4 ${deal.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {deal.status}
              </Badge>
            </div>

            <div className="p-4 lg:p-6">
              <h1 className="text-xl lg:text-2xl font-bold text-slate-900 mb-2">{deal.title}</h1>
              <p className="text-slate-600 mb-6">{deal.description}</p>

              {/* Price Grid */}
              <div className="grid grid-cols-3 gap-3 lg:gap-4 mb-6">
                <div className="p-3 lg:p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Retail</p>
                  <p className="text-lg lg:text-xl font-bold text-slate-900">${retailNum.toFixed(0)}</p>
                </div>
                <div className={`p-3 lg:p-4 rounded-xl ${isAbove ? "bg-emerald-50" : isRetail ? "bg-blue-50" : "bg-amber-50"}`}>
                  <p className={`text-xs uppercase tracking-wider mb-1 ${isAbove ? "text-emerald-600" : isRetail ? "text-blue-600" : "text-amber-600"}`}>Payout</p>
                  <p className={`text-lg lg:text-xl font-bold ${isAbove ? "text-emerald-700" : isRetail ? "text-blue-700" : "text-amber-700"}`}>${payoutNum.toFixed(0)}</p>
                </div>
                <div className="p-3 lg:p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Percent</p>
                  <p className="text-lg lg:text-xl font-bold text-slate-900">{percent}%</p>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-3 gap-3 lg:gap-4 p-3 lg:p-4 bg-slate-50 rounded-xl text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400 hidden lg:block" />
                  <div>
                    <p className="text-xs text-slate-500">Limit</p>
                    <p className="font-semibold text-slate-900">{deal.limitPerVendor || "∞"}/vendor</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-slate-400 hidden lg:block" />
                  <div>
                    <p className="text-xs text-slate-500">Free Label</p>
                    <p className="font-semibold text-slate-900">{deal.freeLabelMin || "N/A"}+</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400 hidden lg:block" />
                  <div>
                    <p className="text-xs text-slate-500">Deadline</p>
                    <p className="font-semibold text-slate-900">
                      {deal.deadline ? new Date(deal.deadline).toLocaleDateString() : "Open"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Commit Form - Simplified */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 lg:p-6 sticky top-4 lg:top-8">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Commit to this Deal</h2>
            <p className="text-sm text-slate-500 mb-4">
              Reserve your quantity now. You'll set delivery details later in My Commitments.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={deal.limitPerVendor || 999}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="How many units?"
                  required
                  className="mt-1"
                />
                {deal.limitPerVendor && (
                  <p className="text-xs text-slate-500 mt-1">Max: {deal.limitPerVendor} units per vendor</p>
                )}
              </div>

              {/* Estimated Payout */}
              {quantity && Number(quantity) > 0 && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-sm font-medium text-emerald-700 mb-1">Estimated Payout</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    ${estimatedPayout.toFixed(2)}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    {quantity} units × ${payoutNum.toFixed(0)}/unit
                  </p>
                  {qualifiesForFreeLabel && (
                    <p className="text-xs text-emerald-700 mt-2 font-medium">
                      ✓ Qualifies for free shipping label!
                    </p>
                  )}
                </div>
              )}

              {deal.deadline && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg text-amber-800 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>Deliver by {new Date(deal.deadline).toLocaleDateString()}</p>
                </div>
              )}

              <Button 
                type="submit" 
                variant="purple" 
                size="lg" 
                className="w-full"
                disabled={isSubmitting || !quantity}
              >
                {isSubmitting ? "Committing..." : "Commit to Deal"}
              </Button>

              <p className="text-xs text-slate-400 text-center">
                After committing, go to My Commitments to set delivery method
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
