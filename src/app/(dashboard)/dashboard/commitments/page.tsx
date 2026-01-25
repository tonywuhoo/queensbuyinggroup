"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Package, Truck, Clock, CheckCircle, FileText, MapPin, AlertCircle, X, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Commitment {
  id: string;
  commitmentId: string;
  commitmentNumber: number;
  quantity: number;
  status: string;
  deliveryMethod: string;
  warehouse: string;
  createdAt: string;
  shippedAt?: string;
  fulfilledAt?: string;
  deal: {
    id: string;
    dealId: string;
    title: string;
    retailPrice: number;
    payout: number;
    freeLabelMin?: number;
  };
  tracking?: {
    trackingNumber: string;
    carrier: string;
    lastStatus?: string;
  };
  labelRequest?: {
    id: string;
    status: string;
  };
  invoice?: {
    skynovaUrl: string;
    amount: number;
  };
}

interface Warehouse {
  id: string;
  code: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  allowDropOff: boolean;
  allowShipping: boolean;
  isActive: boolean;
}

export default function CommitmentsPage() {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [warehouseFilter, setWarehouseFilter] = useState<string>("ALL");
  
  // Edit modal state
  const [editingCommitment, setEditingCommitment] = useState<Commitment | null>(null);
  const [editDeliveryMethod, setEditDeliveryMethod] = useState<string>("");
  const [editWarehouse, setEditWarehouse] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  
  // Cancel confirmation
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchCommitments = async () => {
    try {
      const res = await fetch('/api/commitments');
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

  const fetchWarehouses = async () => {
    try {
      const res = await fetch('/api/warehouses');
      if (res.ok) {
        const data = await res.json();
        setWarehouses(data);
      }
    } catch (e) {
      console.error('Error fetching warehouses:', e);
    }
  };

  useEffect(() => {
    fetchCommitments();
    fetchWarehouses();
  }, []);
  
  // Filter warehouses based on selected delivery method
  const availableWarehouses = editDeliveryMethod 
    ? warehouses.filter(wh => 
        editDeliveryMethod === "DROP_OFF" ? wh.allowDropOff : wh.allowShipping
      )
    : [];

  const openEditModal = (commitment: Commitment) => {
    setEditingCommitment(commitment);
    setEditDeliveryMethod(commitment.deliveryMethod);
    setEditWarehouse(commitment.warehouse === "TBD" ? "" : commitment.warehouse);
  };

  const closeEditModal = () => {
    setEditingCommitment(null);
    setEditDeliveryMethod("");
    setEditWarehouse("");
    setEditError("");
  };

  const saveDeliveryDetails = async () => {
    if (!editingCommitment || !editDeliveryMethod || !editWarehouse) return;
    
    setSaving(true);
    try {
      const res = await fetch('/api/commitments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCommitment.id,
          deliveryMethod: editDeliveryMethod,
          warehouse: editWarehouse,
        })
      });

      if (res.ok) {
        await fetchCommitments();
        closeEditModal();
      } else {
        const error = await res.json();
        setEditError(error.error || 'Failed to update');
      }
    } catch (e) {
      console.error('Error updating commitment:', e);
    } finally {
      setSaving(false);
    }
  };

  const cancelCommitment = async (id: string) => {
    setCancellingId(id);
    try {
      const res = await fetch(`/api/commitments?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchCommitments();
        closeEditModal();
      }
    } catch (e) {
      console.error('Error cancelling:', e);
    } finally {
      setCancellingId(null);
    }
  };

  const filteredCommitments = warehouseFilter === "ALL" 
    ? commitments 
    : commitments.filter(c => c.warehouse === warehouseFilter);

  // Group by status (cancelled already excluded from API)
  const needsSetup = filteredCommitments.filter(c => c.status === 'PENDING' && c.warehouse === 'TBD');
  const actionRequired = filteredCommitments.filter(c => c.status === 'PENDING' && c.warehouse !== 'TBD');
  const awaitingDropoff = filteredCommitments.filter(c => c.status === 'DROP_OFF_PENDING');
  const inProgress = filteredCommitments.filter(c => ['IN_TRANSIT', 'DELIVERED'].includes(c.status));
  const fulfilled = filteredCommitments.filter(c => c.status === 'FULFILLED');

  const getStatusBadge = (status: string, warehouse: string) => {
    if (status === "PENDING" && warehouse === "TBD") {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">Setup Required</span>;
    }
    switch (status) {
      case "PENDING":
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Ready to Ship</span>;
      case "DROP_OFF_PENDING":
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">Awaiting Drop-off</span>;
      case "IN_TRANSIT":
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">In Transit</span>;
      case "DELIVERED":
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">Delivered</span>;
      case "FULFILLED":
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Fulfilled</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-queens-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const CommitmentCard = ({ commitment }: { commitment: Commitment }) => {
    const payout = Number(commitment.deal.payout) * commitment.quantity;
    const needsSetup = commitment.warehouse === "TBD";
    const qualifiesForFreeLabel = commitment.deal.freeLabelMin && commitment.quantity >= commitment.deal.freeLabelMin;
    
    return (
      <div className={`bg-white rounded-xl border p-4 hover:shadow-md transition-shadow ${needsSetup ? "border-purple-300" : "border-slate-200"}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono bg-queens-purple/10 px-1.5 py-0.5 rounded text-queens-purple font-semibold">
                {commitment.commitmentId}
              </span>
              <span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                {commitment.deal.dealId}
              </span>
              {qualifiesForFreeLabel && (
                <span className="text-xs text-green-600">✓ Free label</span>
              )}
            </div>
            <h3 className="font-medium text-slate-900 truncate">{commitment.deal.title}</h3>
            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
              <span>Qty: {commitment.quantity}</span>
              {commitment.warehouse !== "TBD" && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {commitment.warehouse}
                </span>
              )}
              {commitment.warehouse !== "TBD" && (
                <span>{commitment.deliveryMethod === 'DROP_OFF' ? 'Drop-off' : 'Ship'}</span>
              )}
            </div>
          </div>
          {getStatusBadge(commitment.status, commitment.warehouse)}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-green-600 font-semibold">${payout.toLocaleString()} payout</p>
          
          <div className="flex gap-2">
            {/* Needs setup */}
            {needsSetup && (
              <Button size="sm" variant="purple" onClick={() => openEditModal(commitment)}>
                <Settings className="w-3 h-3 mr-1" />
                Set Delivery
              </Button>
            )}
            
            {/* Ready to ship - can request label or submit tracking */}
            {commitment.status === 'PENDING' && !needsSetup && commitment.deliveryMethod === 'SHIP' && (
              <>
                {!commitment.labelRequest && (
                  <Link href="/dashboard/labels">
                    <Button size="sm" variant="outline">
                      <FileText className="w-3 h-3 mr-1" />
                      Request Label
                    </Button>
                  </Link>
                )}
                <Link href="/dashboard/submit-tracking">
                  <Button size="sm">
                    <Truck className="w-3 h-3 mr-1" />
                    Submit Tracking
                  </Button>
                </Link>
              </>
            )}
            
            {/* Has tracking */}
            {commitment.tracking && (
              <Link href="/dashboard/tracking">
                <Button size="sm" variant="outline">
                  <Truck className="w-3 h-3 mr-1" />
                  Track
                </Button>
              </Link>
            )}
            
            {/* Has invoice */}
            {commitment.invoice && (
              <a href={commitment.invoice.skynovaUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline">
                  <FileText className="w-3 h-3 mr-1" />
                  Invoice
                </Button>
              </a>
            )}

            {/* Edit button for pending */}
            {['PENDING', 'DROP_OFF_PENDING'].includes(commitment.status) && !needsSetup && (
              <Button size="sm" variant="ghost" onClick={() => openEditModal(commitment)}>
                <Settings className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      {/* Edit Modal */}
      {editingCommitment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeEditModal}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Set Delivery Details</h2>
                <button onClick={closeEditModal} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-500 mt-1">{editingCommitment.deal.title}</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Delivery Method */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Delivery Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setEditDeliveryMethod("DROP_OFF"); setEditWarehouse(""); }}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      editDeliveryMethod === "DROP_OFF"
                        ? "border-queens-purple bg-queens-purple/5"
                        : "border-slate-200 hover:border-queens-purple"
                    }`}
                  >
                    <MapPin className={`w-5 h-5 mb-2 ${editDeliveryMethod === "DROP_OFF" ? "text-queens-purple" : "text-slate-400"}`} />
                    <p className="font-medium text-sm">Drop Off</p>
                    <p className="text-xs text-slate-500">MA, NJ, CT, NY</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditDeliveryMethod("SHIP"); setEditWarehouse(""); }}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      editDeliveryMethod === "SHIP"
                        ? "border-queens-purple bg-queens-purple/5"
                        : "border-slate-200 hover:border-queens-purple"
                    }`}
                  >
                    <Truck className={`w-5 h-5 mb-2 ${editDeliveryMethod === "SHIP" ? "text-queens-purple" : "text-slate-400"}`} />
                    <p className="font-medium text-sm">Ship</p>
                    <p className="text-xs text-slate-500">DE only</p>
                  </button>
                </div>
              </div>

              {/* Warehouse */}
              {editDeliveryMethod && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {editDeliveryMethod === "DROP_OFF" ? "Drop-off Location" : "Ship to Warehouse"}
                  </label>
                  {availableWarehouses.length > 0 ? (
                    <div className="space-y-2">
                      {availableWarehouses.map((wh) => (
                        <button
                          key={wh.code}
                          type="button"
                          onClick={() => setEditWarehouse(wh.code)}
                          className={`w-full p-3 rounded-xl border text-left transition-all ${
                            editWarehouse === wh.code
                              ? "border-queens-purple bg-queens-purple/5"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              editWarehouse === wh.code ? "bg-queens-purple text-white" : "bg-slate-100"
                            }`}>
                              <span className="font-bold text-sm">{wh.code}</span>
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{wh.name}</p>
                              {wh.address && <p className="text-xs text-slate-500">{wh.address}, {wh.city}, {wh.state} {wh.zip}</p>}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 p-4 bg-slate-50 rounded-lg text-center">
                      No warehouses available for {editDeliveryMethod === "DROP_OFF" ? "drop-off" : "shipping"}
                    </p>
                  )}
                </div>
              )}

              {/* Error message */}
              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {editError}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={closeEditModal}>
                  Close
                </Button>
                <Button 
                  variant="purple" 
                  className="flex-1" 
                  onClick={saveDeliveryDetails}
                  disabled={!editDeliveryMethod || !editWarehouse || saving}
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>

              {/* Cancel commitment option */}
              <Button
                variant="ghost"
                onClick={() => cancelCommitment(editingCommitment.id)}
                disabled={cancellingId === editingCommitment.id}
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {cancellingId === editingCommitment.id ? "Cancelling..." : "Cancel this commitment"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Commitments</h1>
          <p className="text-slate-500 text-sm">{commitments.length} active commitments</p>
        </div>
        <Link href="/dashboard/deals">
          <Button>Browse Deals</Button>
        </Link>
      </div>

      {/* Warehouse Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setWarehouseFilter("ALL")}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            warehouseFilter === "ALL"
              ? "bg-queens-purple text-white"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          All Warehouses
        </button>
        {warehouses.map((wh) => (
          <button
            key={wh.code}
            onClick={() => setWarehouseFilter(wh.code)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              warehouseFilter === wh.code
                ? "bg-queens-purple text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {wh.code}
          </button>
        ))}
      </div>

      {/* Needs Setup */}
      {needsSetup.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-purple-600 mb-3 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Setup Required ({needsSetup.length})
          </h2>
          <div className="grid gap-3">
            {needsSetup.map((c) => <CommitmentCard key={c.id} commitment={c} />)}
          </div>
        </div>
      )}

      {/* Action Required */}
      {actionRequired.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-yellow-600 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Ready to Ship ({actionRequired.length})
          </h2>
          <div className="grid gap-3">
            {actionRequired.map((c) => <CommitmentCard key={c.id} commitment={c} />)}
          </div>
        </div>
      )}

      {/* Awaiting Drop-off */}
      {awaitingDropoff.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-orange-600 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Awaiting Drop-off ({awaitingDropoff.length})
          </h2>
          <div className="grid gap-3">
            {awaitingDropoff.map((c) => <CommitmentCard key={c.id} commitment={c} />)}
          </div>
        </div>
      )}

      {/* In Progress */}
      {inProgress.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-blue-600 mb-3 flex items-center gap-2">
            <Truck className="w-4 h-4" />
            In Progress ({inProgress.length})
          </h2>
          <div className="grid gap-3">
            {inProgress.map((c) => <CommitmentCard key={c.id} commitment={c} />)}
          </div>
        </div>
      )}

      {/* Fulfilled */}
      {fulfilled.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-green-600 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Fulfilled ({fulfilled.length})
          </h2>
          <div className="grid gap-3">
            {fulfilled.map((c) => <CommitmentCard key={c.id} commitment={c} />)}
          </div>
        </div>
      )}

      {commitments.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">No commitments yet</p>
          <p className="text-sm text-slate-400 mt-1">Browse deals to make your first commitment</p>
          <Link href="/dashboard/deals">
            <Button className="mt-4">Browse Deals</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
