"use client";

import { useState, useEffect } from "react";
import { Search, Package, Filter, CheckCircle, X, FileText, ExternalLink, AlertCircle, Star, User, Building, CreditCard, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const WAREHOUSES = [
  { id: "ALL", label: "All" },
  { id: "MA", label: "MA" },
  { id: "NJ", label: "NJ" },
  { id: "CT", label: "CT" },
  { id: "DE", label: "DE" },
  { id: "TBD", label: "Not Set" },
];

interface Commitment {
  id: string;
  commitmentId: string;
  commitmentNumber: number;
  quantity: number;
  status: string;
  deliveryMethod: string;
  warehouse: string;
  createdAt: string;
  payoutRate?: number;
  isVipPricing?: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    vendorNumber: number;
    isExclusiveMember?: boolean;
    companyName?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    bankName?: string;
    bankRouting?: string;
    bankAccount?: string;
    accountingNotes?: string;
  };
  deal: {
    id: string;
    title: string;
    payout: number;
  };
  tracking?: {
    trackingNumber: string;
    carrier: string;
  };
  invoice?: {
    skynovaUrl: string;
  };
}

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-amber-100 text-amber-700" },
  DROP_OFF_PENDING: { label: "Drop-off Pending", color: "bg-orange-100 text-orange-700" },
  IN_TRANSIT: { label: "In Transit", color: "bg-blue-100 text-blue-700" },
  DELIVERED: { label: "Delivered", color: "bg-cyan-100 text-cyan-700" },
  FULFILLED: { label: "Fulfilled", color: "bg-purple-100 text-purple-700" },
  CANCELLED: { label: "Cancelled", color: "bg-slate-100 text-slate-700" },
};

export default function AdminCommitmentsPage() {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeWarehouse, setActiveWarehouse] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [fulfillModal, setFulfillModal] = useState<Commitment | null>(null);
  const [invoiceUrl, setInvoiceUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [fulfillError, setFulfillError] = useState("");
  const [clientInfoModal, setClientInfoModal] = useState<Commitment | null>(null);

  const fetchCommitments = async () => {
    try {
      const res = await fetch('/api/admin/commitments');
      if (res.ok) {
        const data = await res.json();
        setCommitments(data);
      }
    } catch (e) {
      console.error('Error fetching commitments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommitments();
  }, []);

  const filteredCommitments = commitments.filter((c) => {
    const matchesWarehouse = activeWarehouse === "ALL" || c.warehouse === activeWarehouse;
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    const searchLower = searchQuery.toLowerCase();
    const vendorId = `U-${String(c.user.vendorNumber).padStart(5, "0")}`;
    const matchesSearch = 
      c.tracking?.trackingNumber?.toLowerCase().includes(searchLower) ||
      c.user.firstName.toLowerCase().includes(searchLower) ||
      c.user.lastName.toLowerCase().includes(searchLower) ||
      vendorId.toLowerCase().includes(searchLower) ||
      c.deal.title.toLowerCase().includes(searchLower);
    return matchesWarehouse && matchesStatus && matchesSearch;
  });

  const handleFulfill = async () => {
    if (!fulfillModal || !invoiceUrl) return;
    
    setIsProcessing(true);
    setFulfillError("");
    try {
      const res = await fetch('/api/admin/commitments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: fulfillModal.id,
          status: 'FULFILLED',
          invoiceUrl,
        })
      });
      
      if (res.ok) {
        await fetchCommitments();
        setFulfillModal(null);
        setInvoiceUrl("");
        setFulfillError("");
      } else {
        const error = await res.json();
        setFulfillError(error.error || 'Failed to fulfill commitment');
      }
    } catch (e) {
      console.error('Error fulfilling commitment:', e);
      setFulfillError('Failed to fulfill commitment');
    } finally {
      setIsProcessing(false);
    }
  };

  const readyToFulfill = commitments.filter(c => c.status === "DELIVERED" || c.status === "DROP_OFF_PENDING");
  const pendingDropoffs = commitments.filter(c => c.status === "DROP_OFF_PENDING");
  const pendingSetup = commitments.filter(c => c.warehouse === "TBD");

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-queens-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast here
  };

  return (
    <div className="p-6">
      {/* Client Info Modal */}
      {clientInfoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setClientInfoModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Client Information</h2>
            <p className="text-sm text-slate-500 mb-6">U-{String(clientInfoModal.user.vendorNumber).padStart(5, "0")}</p>
            
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <User className="w-5 h-5 text-slate-400" />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">
                    {clientInfoModal.user.firstName} {clientInfoModal.user.lastName}
                    {clientInfoModal.user.isExclusiveMember && (
                      <span className="ml-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-semibold">
                        <Star className="w-2.5 h-2.5" />
                        VIP
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-slate-500">{clientInfoModal.user.email}</p>
                  {clientInfoModal.user.phone && <p className="text-sm text-slate-500">{clientInfoModal.user.phone}</p>}
                </div>
              </div>

              {/* Company / Address */}
              {(clientInfoModal.user.companyName || clientInfoModal.user.address) && (
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Building className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">Business Info</span>
                  </div>
                  {clientInfoModal.user.companyName && (
                    <p className="font-medium text-slate-900 mb-1">{clientInfoModal.user.companyName}</p>
                  )}
                  {clientInfoModal.user.address && (
                    <div className="text-sm text-slate-600">
                      <p>{clientInfoModal.user.address}</p>
                      {(clientInfoModal.user.city || clientInfoModal.user.state || clientInfoModal.user.zipCode) && (
                        <p>{clientInfoModal.user.city}{clientInfoModal.user.city && clientInfoModal.user.state ? ', ' : ''}{clientInfoModal.user.state} {clientInfoModal.user.zipCode}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Bank Info */}
              {(clientInfoModal.user.bankName || clientInfoModal.user.bankRouting || clientInfoModal.user.bankAccount) && (
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">Payment Info</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    {clientInfoModal.user.bankName && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Bank:</span>
                        <span className="font-medium text-slate-900">{clientInfoModal.user.bankName}</span>
                      </div>
                    )}
                    {clientInfoModal.user.bankRouting && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Routing:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-slate-900">{clientInfoModal.user.bankRouting}</span>
                          <button onClick={() => copyToClipboard(clientInfoModal.user.bankRouting!, 'Routing')} className="p-1 hover:bg-slate-200 rounded">
                            <Copy className="w-3 h-3 text-slate-400" />
                          </button>
                        </div>
                      </div>
                    )}
                    {clientInfoModal.user.bankAccount && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Account:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-slate-900">{clientInfoModal.user.bankAccount}</span>
                          <button onClick={() => copyToClipboard(clientInfoModal.user.bankAccount!, 'Account')} className="p-1 hover:bg-slate-200 rounded">
                            <Copy className="w-3 h-3 text-slate-400" />
                          </button>
                        </div>
                      </div>
                    )}
                    {clientInfoModal.user.accountingNotes && (
                      <div className="pt-2 mt-2 border-t border-slate-200">
                        <span className="text-slate-500">Notes:</span>
                        <p className="text-slate-700 mt-1">{clientInfoModal.user.accountingNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* No info message */}
              {!clientInfoModal.user.companyName && !clientInfoModal.user.address && !clientInfoModal.user.bankName && (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-500 text-sm">
                  No business or payment info on file
                </div>
              )}
            </div>

            <div className="mt-6">
              <Button variant="outline" className="w-full" onClick={() => setClientInfoModal(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Fulfill Modal */}
      {fulfillModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md relative">
            <button onClick={() => { setFulfillModal(null); setFulfillError(""); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Close Out Commitment</h2>
            <p className="text-slate-500 text-sm mb-4">Attach invoice and mark as fulfilled</p>
            
            {/* Commitment Info */}
            <div className="p-4 bg-slate-50 rounded-xl mb-4">
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="font-medium text-slate-900">{fulfillModal.deal.title}</p>
                  <p className="text-sm text-slate-500">{fulfillModal.quantity} units</p>
                </div>
              </div>
              <div className="text-sm text-slate-600 space-y-1">
                <p className="flex items-center gap-2">
                  <strong>Vendor:</strong> {fulfillModal.user.firstName} {fulfillModal.user.lastName} (U-{String(fulfillModal.user.vendorNumber).padStart(5, "0")})
                  {fulfillModal.user.isExclusiveMember && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-semibold">
                      <Star className="w-2.5 h-2.5" />
                      VIP
                    </span>
                  )}
                </p>
                <p><strong>Warehouse:</strong> {fulfillModal.warehouse}</p>
                {fulfillModal.isVipPricing && fulfillModal.payoutRate && (
                  <p className="flex items-center gap-1 text-amber-700">
                    <Star className="w-3 h-3" />
                    <strong>VIP Rate:</strong> ${Number(fulfillModal.payoutRate).toFixed(2)}/unit
                  </p>
                )}
                {fulfillModal.tracking && <p><strong>Tracking:</strong> {fulfillModal.tracking.trackingNumber}</p>}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={() => { setClientInfoModal(fulfillModal); }}
              >
                <User className="w-3 h-3 mr-1" />
                View Client Info
              </Button>
            </div>

            {/* Invoice URL Input */}
            <div className="mb-4">
              <Label htmlFor="invoice">Skynova Invoice URL</Label>
              <Input
                id="invoice"
                value={invoiceUrl}
                onChange={(e) => setInvoiceUrl(e.target.value)}
                placeholder="https://www.skynova.com/purchaseorders/..."
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">
                Paste the Skynova purchase order link
              </p>
            </div>

            {fulfillError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {fulfillError}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setFulfillModal(null); setFulfillError(""); }}>
                Cancel
              </Button>
              <Button 
                variant="purple" 
                className="flex-1" 
                onClick={handleFulfill}
                disabled={!invoiceUrl || isProcessing}
              >
                {isProcessing ? "Processing..." : "Mark Fulfilled"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">All Commitments</h1>
        <p className="text-slate-500 text-sm">{commitments.length} total commitments</p>
      </div>

      {/* Alerts Section */}
      <div className="space-y-3 mb-6">
        {/* Drop-offs Alert */}
        {pendingDropoffs.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-900">{pendingDropoffs.length} pending drop-offs</p>
                <p className="text-sm text-orange-700">Vendors coming to drop off in person - click "Fulfill" when they arrive</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Ready to Fulfill Alert */}
        {readyToFulfill.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="font-medium text-emerald-900">{readyToFulfill.length} commitments ready to fulfill</p>
                <p className="text-sm text-emerald-700">Items delivered or drop-offs ready - attach invoice to close out</p>
              </div>
            </div>
          </div>
        )}

        {/* Pending Setup Alert */}
        {pendingSetup.length > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium text-purple-900">{pendingSetup.length} awaiting vendor setup</p>
                <p className="text-sm text-purple-700">Vendors haven't set delivery method yet</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-6">
        {/* Warehouse Filter */}
        <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-1.5 w-fit">
          <Package className="w-4 h-4 text-slate-400 ml-2" />
          {WAREHOUSES.map((wh) => (
            <button
              key={wh.id}
              onClick={() => setActiveWarehouse(wh.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeWarehouse === wh.id
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {wh.label}
            </button>
          ))}
        </div>

        {/* Search and Status */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 bg-white rounded-xl border border-slate-200">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search tracking ID, user, or deal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-0 bg-transparent focus-visible:ring-0 h-10 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-1.5 overflow-x-auto">
            <Filter className="w-4 h-4 text-slate-400 ml-2 flex-shrink-0" />
            {["ALL", "PENDING", "DROP_OFF_PENDING", "IN_TRANSIT", "DELIVERED", "FULFILLED"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  statusFilter === status
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {status === "ALL" ? "All" : status.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      {filteredCommitments.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">ID</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">User</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Deal</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Tracking</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">WH</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Qty</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCommitments.map((commitment) => {
                  const status = statusConfig[commitment.status] || statusConfig.PENDING;
                  const canFulfill = commitment.status === "DELIVERED" || commitment.status === "DROP_OFF_PENDING";
                  const vendorId = `U-${String(commitment.user.vendorNumber).padStart(5, "0")}`;
                  
                  return (
                    <tr key={commitment.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold text-queens-purple">{commitment.commitmentId}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-900 text-sm flex items-center gap-1.5">
                            {commitment.user.firstName} {commitment.user.lastName}
                            {commitment.user.isExclusiveMember && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-semibold">
                                <Star className="w-2.5 h-2.5" />
                                VIP
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500 font-mono">{vendorId}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-700">{commitment.deal.title}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          {commitment.deliveryMethod === 'DROP_OFF' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                              <Package className="w-3 h-3" />
                              Drop-off
                            </span>
                          ) : commitment.tracking ? (
                            <>
                              <span className="font-mono text-xs text-slate-900">{commitment.tracking.trackingNumber}</span>
                              <p className="text-xs text-slate-500">{commitment.tracking.carrier}</p>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400">No tracking yet</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-slate-900">{commitment.warehouse}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <span className="text-sm font-medium text-slate-900">{commitment.quantity}</span>
                          {commitment.isVipPricing && commitment.payoutRate && (
                            <p className="text-[10px] text-amber-600 font-medium flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5" />
                              ${Number(commitment.payoutRate).toFixed(0)}/ea
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={status.color}>{status.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() => setClientInfoModal(commitment)}
                          >
                            <User className="w-3 h-3" />
                          </Button>
                          {canFulfill && (
                            <Button 
                              variant="purple" 
                              size="sm" 
                              className="text-xs"
                              onClick={() => setFulfillModal(commitment)}
                            >
                              <FileText className="w-3 h-3 mr-1" />
                              Fulfill
                            </Button>
                          )}
                          {commitment.status === "FULFILLED" && commitment.invoice?.skynovaUrl && (
                            <a href={commitment.invoice.skynovaUrl} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm" className="text-xs">
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Invoice
                              </Button>
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">No commitments found</p>
        </div>
      )}
    </div>
  );
}
