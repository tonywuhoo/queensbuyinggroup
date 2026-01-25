"use client";

import { useState } from "react";
import { Search, Package, CheckCircle, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Commitment {
  id: string;
  quantity: number;
  status: string;
  warehouse: string;
  deliveryMethod: string;
  createdAt: string;
  deal: {
    title: string;
    payout: number;
  };
}

interface VendorWithCommitments {
  id: string;
  vendorId: string;
  firstName: string;
  lastName: string;
  email: string;
  commitments: Commitment[];
}

export default function AdminDropoffsPage() {
  const [search, setSearch] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<VendorWithCommitments | null>(null);
  const [vendors, setVendors] = useState<VendorWithCommitments[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [fulfillModalOpen, setFulfillModalOpen] = useState(false);
  const [selectedCommitment, setSelectedCommitment] = useState<Commitment | null>(null);
  const [invoiceUrl, setInvoiceUrl] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [fulfilling, setFulfilling] = useState(false);

  const searchVendors = async () => {
    if (!search.trim()) return;
    setLoading(true);
    
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          vendorNumber: search.startsWith('U-') ? parseInt(search.slice(2)) : undefined,
        })
      });
      
      if (res.ok) {
        const user = await res.json();
        if (user) {
          setVendors([{
            id: user.id,
            vendorId: user.vendorId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            commitments: user.commitments || []
          }]);
        }
      } else {
        // Try searching by name/email
        const searchRes = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}`);
        if (searchRes.ok) {
          const users = await searchRes.json();
          // For each user, fetch their commitments
          const vendorsWithCommitments = await Promise.all(
            users.slice(0, 5).map(async (u: any) => {
              const detailRes = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: u.id })
              });
              if (detailRes.ok) {
                const detail = await detailRes.json();
                return {
                  id: detail.id,
                  vendorId: detail.vendorId,
                  firstName: detail.firstName,
                  lastName: detail.lastName,
                  email: detail.email,
                  commitments: detail.commitments || []
                };
              }
              return null;
            })
          );
          setVendors(vendorsWithCommitments.filter(Boolean));
        }
      }
    } catch (e) {
      console.error('Error searching vendors:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleFulfill = async () => {
    if (!selectedCommitment || !invoiceUrl) return;
    
    setFulfilling(true);
    try {
      const res = await fetch('/api/admin/commitments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCommitment.id,
          status: 'FULFILLED',
          invoiceUrl,
          invoiceAmount: invoiceAmount || (Number(selectedCommitment.deal.payout) * selectedCommitment.quantity)
        })
      });

      if (res.ok) {
        if (selectedVendor) {
          const updated = {
            ...selectedVendor,
            commitments: selectedVendor.commitments.map(c =>
              c.id === selectedCommitment.id ? { ...c, status: "FULFILLED" } : c
            )
          };
          setSelectedVendor(updated);
          setVendors(vendors.map(v => v.id === updated.id ? updated : v));
        }
        closeModal();
      }
    } catch (e) {
      console.error('Error fulfilling commitment:', e);
    } finally {
      setFulfilling(false);
    }
  };

  const closeModal = () => {
    setFulfillModalOpen(false);
    setSelectedCommitment(null);
    setInvoiceUrl("");
    setInvoiceAmount("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DROP_OFF_PENDING":
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">Awaiting Drop-off</span>;
      case "PENDING":
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Pending</span>;
      case "IN_TRANSIT":
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">In Transit</span>;
      case "FULFILLED":
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Fulfilled</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Process Drop-offs</h1>
        <p className="text-slate-500 text-sm">Search for a vendor to view and process their drop-offs</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 lg:p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Enter Vendor ID (U-XXXXX), name, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchVendors()}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-queens-purple/20 focus:border-queens-purple"
            />
          </div>
          <Button onClick={searchVendors} disabled={loading} className="sm:px-8">
            {loading ? "Searching..." : "Search"}
          </Button>
        </div>

        {vendors.length > 0 && (
          <div className="mt-4 space-y-2">
            {vendors.map((vendor) => (
              <button
                key={vendor.id}
                onClick={() => setSelectedVendor(vendor)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedVendor?.id === vendor.id
                    ? "border-queens-purple bg-queens-purple/5"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-queens-purple/10 flex items-center justify-center">
                      <span className="text-queens-purple font-bold text-sm">
                        {vendor.firstName[0]}{vendor.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {vendor.firstName} {vendor.lastName}
                        <span className="ml-2 font-mono text-xs text-queens-purple">{vendor.vendorId}</span>
                      </p>
                      <p className="text-sm text-slate-500">{vendor.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-orange-600">
                      {vendor.commitments.filter(c => c.status === "DROP_OFF_PENDING").length}
                    </p>
                    <p className="text-xs text-slate-500">Pending</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Vendor */}
      {selectedVendor && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 lg:p-6 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-queens-purple flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {selectedVendor.firstName[0]}{selectedVendor.lastName[0]}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedVendor.firstName} {selectedVendor.lastName}</h2>
                <p className="text-sm text-slate-500">{selectedVendor.email}</p>
                <p className="text-sm font-mono text-queens-purple">{selectedVendor.vendorId}</p>
              </div>
            </div>
          </div>

          <div className="p-4 lg:p-6">
            {/* Awaiting Drop-off */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-orange-600 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Awaiting Drop-off ({selectedVendor.commitments.filter(c => c.status === "DROP_OFF_PENDING").length})
              </h3>
              <div className="space-y-3">
                {selectedVendor.commitments.filter(c => c.status === "DROP_OFF_PENDING").map((c) => (
                  <div key={c.id} className="p-4 rounded-xl border border-orange-200 bg-orange-50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{c.deal.title}</p>
                        <div className="flex flex-wrap gap-3 mt-1 text-sm text-slate-600">
                          <span>Qty: {c.quantity}</span>
                          <span>Warehouse: {c.warehouse}</span>
                          <span className="text-green-600 font-medium">
                            ${(Number(c.deal.payout) * c.quantity).toLocaleString()} payout
                          </span>
                        </div>
                      </div>
                      <Button onClick={() => { setSelectedCommitment(c); setFulfillModalOpen(true); }} className="w-full sm:w-auto">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Process
                      </Button>
                    </div>
                  </div>
                ))}
                {selectedVendor.commitments.filter(c => c.status === "DROP_OFF_PENDING").length === 0 && (
                  <p className="text-sm text-slate-500 py-4 text-center">No pending drop-offs</p>
                )}
              </div>
            </div>

            {/* In Progress */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-blue-600 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                In Progress ({selectedVendor.commitments.filter(c => ["PENDING", "IN_TRANSIT"].includes(c.status)).length})
              </h3>
              <div className="space-y-2">
                {selectedVendor.commitments.filter(c => ["PENDING", "IN_TRANSIT"].includes(c.status)).map((c) => (
                  <div key={c.id} className="p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{c.deal.title}</p>
                      <p className="text-xs text-slate-500">Qty: {c.quantity} · {c.warehouse}</p>
                    </div>
                    {getStatusBadge(c.status)}
                  </div>
                ))}
                {selectedVendor.commitments.filter(c => ["PENDING", "IN_TRANSIT"].includes(c.status)).length === 0 && (
                  <p className="text-sm text-slate-500 py-4 text-center">None</p>
                )}
              </div>
            </div>

            {/* Fulfilled */}
            <div>
              <h3 className="text-sm font-semibold text-green-600 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Fulfilled ({selectedVendor.commitments.filter(c => c.status === "FULFILLED").length})
              </h3>
              <div className="space-y-2">
                {selectedVendor.commitments.filter(c => c.status === "FULFILLED").map((c) => (
                  <div key={c.id} className="p-3 rounded-lg border border-green-200 bg-green-50 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{c.deal.title}</p>
                      <p className="text-xs text-slate-500">Qty: {c.quantity} · ${(Number(c.deal.payout) * c.quantity).toLocaleString()}</p>
                    </div>
                    {getStatusBadge(c.status)}
                  </div>
                ))}
                {selectedVendor.commitments.filter(c => c.status === "FULFILLED").length === 0 && (
                  <p className="text-sm text-slate-500 py-4 text-center">None</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fulfill Modal */}
      {fulfillModalOpen && selectedCommitment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeModal}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Process Drop-off</h2>
              <p className="text-sm text-slate-500">Attach Skynova invoice to complete</p>
            </div>

            <div className="p-6">
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <p className="font-medium text-slate-900">{selectedCommitment.deal.title}</p>
                <div className="flex gap-4 mt-2 text-sm text-slate-600">
                  <span>Qty: {selectedCommitment.quantity}</span>
                  <span className="text-green-600 font-medium">
                    ${(Number(selectedCommitment.deal.payout) * selectedCommitment.quantity).toLocaleString()} payout
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Skynova Invoice URL
                </label>
                <input
                  type="url"
                  placeholder="https://www.skynova.com/purchaseorders/..."
                  value={invoiceUrl}
                  onChange={(e) => setInvoiceUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-queens-purple/20"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Invoice Amount (optional)
                </label>
                <input
                  type="number"
                  placeholder={String(Number(selectedCommitment.deal.payout) * selectedCommitment.quantity)}
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-queens-purple/20"
                />
              </div>

              <div className="flex gap-3">
                <button onClick={closeModal} className="flex-1 px-4 py-3 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200">
                  Cancel
                </button>
                <Button onClick={handleFulfill} disabled={!invoiceUrl || fulfilling} className="flex-1">
                  {fulfilling ? "Processing..." : "Complete"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
