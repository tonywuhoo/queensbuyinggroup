"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, DollarSign, Package, Clock, Tag, ImageIcon, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function NewDealPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    retailPrice: "",
    payout: "",
    limitPerVendor: "",
    freeLabelMin: "",
    deadline: "",
    status: "DRAFT",
    isExclusive: false,
    exclusivePrice: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch('/api/admin/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          imageUrl: formData.imageUrl || null,
          retailPrice: parseFloat(formData.retailPrice),
          payout: parseFloat(formData.payout),
          limitPerVendor: formData.limitPerVendor ? parseInt(formData.limitPerVendor) : null,
          freeLabelMin: formData.freeLabelMin ? parseInt(formData.freeLabelMin) : null,
          deadline: formData.deadline || null,
          status: formData.status,
          isExclusive: formData.isExclusive,
          exclusivePrice: formData.exclusivePrice ? parseFloat(formData.exclusivePrice) : null,
        })
      });

      if (res.ok) {
        router.push("/admin/deals");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create deal");
      }
    } catch (err) {
      setError("Failed to create deal");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate profit preview
  const retailNum = parseFloat(formData.retailPrice) || 0;
  const payoutNum = parseFloat(formData.payout) || 0;
  const profit = payoutNum - retailNum;
  const profitPercent = retailNum > 0 ? ((profit / retailNum) * 100).toFixed(1) : "0";

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      {/* Back button */}
      <Link href="/admin/deals" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Deals
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Create New Deal</h1>
        <p className="text-slate-500 text-sm">Add a new product deal for vendors</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Tag className="w-4 h-4 text-queens-purple" />
            Basic Info
          </h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Deal Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., iPhone 15 Pro Max 256GB"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Product requirements, conditions, etc."
                rows={3}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-queens-purple/20"
              />
            </div>
          </div>
        </div>

        {/* Product Image */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-purple-600" />
            Product Image
          </h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/product-image.jpg"
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">Paste a direct link to the product image</p>
            </div>

            {/* Image Preview */}
            {formData.imageUrl && (
              <div className="mt-3">
                <p className="text-sm text-slate-600 mb-2">Preview:</p>
                <div className="w-32 h-32 rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                  <img
                    src={formData.imageUrl}
                    alt="Product preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/128?text=Invalid+URL";
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            Pricing
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="retailPrice">Retail Price ($) *</Label>
              <Input
                id="retailPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.retailPrice}
                onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
                placeholder="1199.00"
                required
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">What vendor pays at store</p>
            </div>

            <div>
              <Label htmlFor="payout">Payout ($) *</Label>
              <Input
                id="payout"
                type="number"
                min="0"
                step="0.01"
                value={formData.payout}
                onChange={(e) => setFormData({ ...formData, payout: e.target.value })}
                placeholder="1050.00"
                required
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">What we pay vendor</p>
            </div>
          </div>

          {/* Profit Preview */}
          {retailNum > 0 && payoutNum > 0 && (
            <div className={`mt-4 p-3 rounded-lg ${profit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-sm">
                <span className="text-slate-600">Vendor Profit: </span>
                <span className={`font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${profit.toFixed(2)} ({profit >= 0 ? '+' : ''}{profitPercent}%)
                </span>
                <span className="text-slate-500 ml-2">
                  {parseFloat(profitPercent) > 0 ? '(Above Retail)' : parseFloat(profitPercent) === 0 ? '(Retail)' : '(Below Cost)'}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Exclusive Pricing */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            Exclusive Pricing
          </h2>
          
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isExclusive}
                onChange={(e) => setFormData({ ...formData, isExclusive: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
              />
              <div>
                <span className="font-medium text-slate-900">Enable Exclusive Pricing</span>
                <p className="text-xs text-slate-500">Show special price to Discord partner members</p>
              </div>
            </label>

            {formData.isExclusive && (
              <div className="pl-8 border-l-2 border-amber-200">
                <Label htmlFor="exclusivePrice">Exclusive Payout ($)</Label>
                <Input
                  id="exclusivePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.exclusivePrice}
                  onChange={(e) => setFormData({ ...formData, exclusivePrice: e.target.value })}
                  placeholder="Higher payout for Discord members"
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">This price is shown only to verified Discord members</p>
                
                {formData.exclusivePrice && parseFloat(formData.exclusivePrice) > 0 && retailNum > 0 && (
                  <div className="mt-3 p-3 bg-amber-50 rounded-lg">
                    <p className="text-sm">
                      <span className="text-slate-600">Exclusive Profit: </span>
                      <span className="font-bold text-amber-600">
                        ${(parseFloat(formData.exclusivePrice) - retailNum).toFixed(2)} 
                        ({((parseFloat(formData.exclusivePrice) - retailNum) / retailNum * 100).toFixed(1)}%)
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Limits & Labels */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" />
            Limits & Labels
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="limitPerVendor">Limit Per Vendor</Label>
              <Input
                id="limitPerVendor"
                type="number"
                min="1"
                value={formData.limitPerVendor}
                onChange={(e) => setFormData({ ...formData, limitPerVendor: e.target.value })}
                placeholder="5"
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">Max units per vendor (optional)</p>
            </div>

            <div>
              <Label htmlFor="freeLabelMin">Free Label Minimum</Label>
              <Input
                id="freeLabelMin"
                type="number"
                min="1"
                value={formData.freeLabelMin}
                onChange={(e) => setFormData({ ...formData, freeLabelMin: e.target.value })}
                placeholder="3"
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">Min qty for free shipping label</p>
            </div>
          </div>
        </div>

        {/* Deadline & Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-600" />
            Deadline & Status
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">Last day to deliver (optional)</p>
            </div>

            <div>
              <Label>Status</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {["DRAFT", "ACTIVE"].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFormData({ ...formData, status })}
                    className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.status === status
                        ? status === "ACTIVE" ? "bg-green-600 text-white" : "bg-slate-700 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Link href="/admin/deals" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Deal"}
          </Button>
        </div>
      </form>
    </div>
  );
}
