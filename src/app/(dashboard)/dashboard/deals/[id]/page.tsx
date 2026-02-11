"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Package, AlertCircle, CheckCircle, Clock, Tag, Users, Star, ExternalLink } from "lucide-react";
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
  isExclusive?: boolean;
  exclusivePrice?: number;
  linkAmazon?: string;
  linkBestBuy?: string;
  linkWalmart?: string;
  linkTarget?: string;
  linkHomeDepot?: string;
  linkLowes?: string;
  linkOther?: string;
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
  const [isExclusiveMember, setIsExclusiveMember] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch deal and profile in parallel
        const [dealRes, profileRes] = await Promise.all([
          fetch(`/api/deals/${dealId}`),
          fetch('/api/profile')
        ]);
        
        if (dealRes.ok) {
          const data = await dealRes.json();
          setDeal(data);
        } else {
          setDeal(null);
        }
        
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setIsExclusiveMember(profileData.isExclusiveMember || false);
        }
      } catch (e) {
        console.error('Error fetching data:', e);
        setDeal(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
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
  const regularPayout = Number(deal.payout);
  
  // Use VIP pricing if user is exclusive member and deal has exclusive price
  const showVipPricing = isExclusiveMember && deal.isExclusive && deal.exclusivePrice;
  const payoutNum = showVipPricing ? Number(deal.exclusivePrice) : regularPayout;
  
  const profit = payoutNum - retailNum;
  const profitPercent = ((profit / retailNum) * 100).toFixed(1);
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
            <div className="w-full h-48 lg:h-64 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center relative overflow-hidden">
              {deal.imageUrl ? (
                <img 
                  src={deal.imageUrl} 
                  alt={deal.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Package className="w-24 h-24 text-slate-200" />
              )}
              <div className="absolute top-4 left-4">
                <span className="text-xs font-mono bg-queens-purple/10 text-queens-purple px-2 py-1 rounded backdrop-blur-sm">
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
                <div className={`p-3 lg:p-4 rounded-xl ${showVipPricing ? "bg-amber-50 ring-2 ring-amber-200" : isAbove ? "bg-emerald-50" : isRetail ? "bg-blue-50" : "bg-amber-50"}`}>
                  <p className={`text-xs uppercase tracking-wider mb-1 flex items-center gap-1 ${showVipPricing ? "text-amber-600" : isAbove ? "text-emerald-600" : isRetail ? "text-blue-600" : "text-amber-600"}`}>
                    {showVipPricing && <Star className="w-3 h-3" />}
                    {showVipPricing ? "VIP Payout" : "Payout"}
                  </p>
                  <p className={`text-lg lg:text-xl font-bold ${showVipPricing ? "text-amber-700" : isAbove ? "text-emerald-700" : isRetail ? "text-blue-700" : "text-amber-700"}`}>${payoutNum.toFixed(0)}</p>
                </div>
                <div className={`p-3 lg:p-4 rounded-xl ${profit >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Profit</p>
                  <p className={`text-lg lg:text-xl font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {profit >= 0 ? "+" : ""}{profitPercent}%
                  </p>
                </div>
              </div>
              
              {/* VIP hint for non-members on exclusive deals */}
              {deal.isExclusive && !isExclusiveMember && (
                <div className="mb-6 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                  <Star className="w-5 h-5 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Exclusive Deal</p>
                    <p className="text-xs text-amber-600">Link your Discord in Settings for VIP pricing</p>
                  </div>
                </div>
              )}

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
              
              {/* Retail Links */}
              {(deal.linkAmazon || deal.linkBestBuy || deal.linkWalmart || deal.linkTarget || deal.linkHomeDepot || deal.linkLowes || deal.linkOther) && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-slate-700 mb-3">Buy from:</p>
                  <div className="flex flex-wrap gap-2">
                    {deal.linkAmazon && (
                      <a
                        href={deal.linkAmazon}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg text-sm font-medium text-orange-700 transition-colors"
                      >
                        <span>🛒</span> Amazon <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {deal.linkBestBuy && (
                      <a
                        href={deal.linkBestBuy}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm font-medium text-blue-700 transition-colors"
                      >
                        <span>🏷️</span> Best Buy <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {deal.linkWalmart && (
                      <a
                        href={deal.linkWalmart}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm font-medium text-blue-700 transition-colors"
                      >
                        <span>🔵</span> Walmart <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {deal.linkTarget && (
                      <a
                        href={deal.linkTarget}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-sm font-medium text-red-700 transition-colors"
                      >
                        <span>🎯</span> Target <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {deal.linkHomeDepot && (
                      <a
                        href={deal.linkHomeDepot}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg text-sm font-medium text-orange-700 transition-colors"
                      >
                        <span>🧰</span> Home Depot <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {deal.linkLowes && (
                      <a
                        href={deal.linkLowes}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm font-medium text-blue-700 transition-colors"
                      >
                        <span>🔧</span> Lowe's <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {deal.linkOther && (
                      <a
                        href={deal.linkOther}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
                      >
                        <span>🔗</span> Other <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}
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
                <div className={`p-4 rounded-xl border ${showVipPricing ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-100"}`}>
                  <p className={`text-sm font-medium mb-1 flex items-center gap-1 ${showVipPricing ? "text-amber-700" : "text-emerald-700"}`}>
                    {showVipPricing && <Star className="w-4 h-4" />}
                    {showVipPricing ? "VIP Estimated Payout" : "Estimated Payout"}
                  </p>
                  <p className={`text-2xl font-bold ${showVipPricing ? "text-amber-700" : "text-emerald-700"}`}>
                    ${estimatedPayout.toFixed(2)}
                  </p>
                  <p className={`text-xs mt-1 ${showVipPricing ? "text-amber-600" : "text-emerald-600"}`}>
                    {quantity} units × ${payoutNum.toFixed(0)}/unit
                  </p>
                  {qualifiesForFreeLabel && (
                    <p className={`text-xs mt-2 font-medium ${showVipPricing ? "text-amber-700" : "text-emerald-700"}`}>
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
