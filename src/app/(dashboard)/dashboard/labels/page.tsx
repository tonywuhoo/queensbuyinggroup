"use client";

import { useState, useEffect } from "react";
import { FileText, Package, Clock, CheckCircle, X, Send, AlertTriangle, MapPin, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Commitment {
  id: string;
  quantity: number;
  warehouse: string;
  status: string;
  deliveryMethod: string;
  deal: {
    title: string;
    freeLabelMin?: number;
  };
  labelRequest?: {
    id: string;
    status: string;
    labelUrl?: string;
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

interface LabelFile {
  name: string;
  url: string;
  uploadedAt: string;
}

interface LabelRequest {
  id: string;
  status: string;
  labelUrl?: string;
  labelFiles?: LabelFile[];
  notes?: string;
  createdAt: string;
  commitment: {
    id: string;
    quantity: number;
    warehouse: string;
    deal: { title: string; freeLabelMin?: number };
  };
}

export default function LabelsPage() {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [needsSetupCommitments, setNeedsSetupCommitments] = useState<Commitment[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [labelRequests, setLabelRequests] = useState<LabelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [error, setError] = useState("");
  
  // Cancel confirmation modal
  const [cancelModal, setCancelModal] = useState<LabelRequest | null>(null);
  
  // Warehouse selection modal for commitments without delivery set
  const [setupCommitment, setSetupCommitment] = useState<Commitment | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [settingUp, setSettingUp] = useState(false);

  const fetchData = async () => {
    try {
      const [commitmentsRes, labelsRes, warehousesRes] = await Promise.all([
        fetch('/api/commitments'),
        fetch('/api/labels'),
        fetch('/api/warehouses?all=true')
      ]);
      
      if (commitmentsRes.ok) {
        const data = await commitmentsRes.json();
        // Show shipping commitments that are pending and don't have label requests
        setCommitments(data.filter((c: Commitment) => 
          c.deliveryMethod === 'SHIP' && 
          c.status === 'PENDING' && 
          !c.labelRequest
        ));
        // Also show commitments that haven't set delivery yet
        setNeedsSetupCommitments(data.filter((c: Commitment) =>
          c.warehouse === 'TBD' &&
          c.status === 'PENDING' &&
          !c.labelRequest
        ));
      }
      
      if (labelsRes.ok) {
        const data = await labelsRes.json();
        setLabelRequests(data);
      }
      
      if (warehousesRes.ok) {
        const data = await warehousesRes.json();
        setWarehouses(data);
      }
    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const shippingWarehouses = warehouses.filter(wh => wh.allowShipping && wh.isActive);

  const handleRequestLabel = async (commitmentId: string) => {
    setRequesting(commitmentId);
    setError("");
    try {
      const res = await fetch('/api/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commitmentId })
      });
      
      if (res.ok) {
        await fetchData(); // Refresh data
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to request label');
      }
    } catch (e) {
      console.error('Error requesting label:', e);
      setError('Failed to request label');
    } finally {
      setRequesting(null);
    }
  };

  // Set delivery to SHIP + warehouse, then request label
  const handleSetupAndRequestLabel = async () => {
    if (!setupCommitment || !selectedWarehouse) return;
    
    setSettingUp(true);
    setError("");
    try {
      // Step 1: Set delivery method to SHIP and warehouse
      const updateRes = await fetch('/api/commitments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: setupCommitment.id,
          deliveryMethod: 'SHIP',
          warehouse: selectedWarehouse,
        })
      });

      if (!updateRes.ok) {
        const data = await updateRes.json();
        setError(data.error || 'Failed to set delivery method');
        setSettingUp(false);
        return;
      }

      // Step 2: Request label
      const labelRes = await fetch('/api/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commitmentId: setupCommitment.id })
      });
      
      if (labelRes.ok) {
        await fetchData();
        setSetupCommitment(null);
        setSelectedWarehouse("");
      } else {
        const data = await labelRes.json();
        setError(data.error || 'Failed to request label');
      }
    } catch (e) {
      console.error('Error:', e);
      setError('Failed to set up delivery and request label');
    } finally {
      setSettingUp(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!cancelModal) return;
    
    setCancelling(cancelModal.id);
    try {
      const res = await fetch(`/api/labels?id=${cancelModal.id}`, { method: 'DELETE' });
      
      if (res.ok) {
        await fetchData();
        setCancelModal(null);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to cancel request');
      }
    } catch (e) {
      console.error('Error cancelling request:', e);
      setError('Failed to cancel request');
    } finally {
      setCancelling(null);
    }
  };

  const pendingRequests = labelRequests.filter(r => r.status === 'PENDING');
  const approvedRequests = labelRequests.filter(r => r.status === 'APPROVED');
  const rejectedRequests = labelRequests.filter(r => r.status === 'REJECTED');

  if (loading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-queens-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      {/* Cancel Confirmation Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setCancelModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 text-center mb-2">Cancel Label Request?</h2>
              <p className="text-sm text-slate-500 text-center mb-6">
                Cancel the label request for <strong>{cancelModal.commitment.deal.title}</strong>?
              </p>
              
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setCancelModal(null)}>
                  Keep Request
                </Button>
                <Button 
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700" 
                  onClick={handleCancelRequest}
                  disabled={cancelling === cancelModal.id}
                >
                  {cancelling === cancelModal.id ? "Cancelling..." : "Yes, Cancel"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Label Requests</h1>
        <p className="text-slate-500 text-sm">Request shipping labels for your commitments</p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Warehouse Selection Modal */}
      {setupCommitment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => { setSetupCommitment(null); setSelectedWarehouse(""); }}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Select Shipping Warehouse</h2>
                <button onClick={() => { setSetupCommitment(null); setSelectedWarehouse(""); }} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Choose a warehouse to ship to for <strong>{setupCommitment.deal.title}</strong>
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 flex items-center gap-2">
                <Truck className="w-4 h-4 flex-shrink-0" />
                <span>This will set your delivery method to <strong>Ship</strong> and request a label.</span>
              </div>

              {shippingWarehouses.length > 0 ? (
                <div className="space-y-2">
                  {shippingWarehouses.map((wh) => (
                    <button
                      key={wh.code}
                      type="button"
                      onClick={() => setSelectedWarehouse(wh.code)}
                      className={`w-full p-3 rounded-xl border text-left transition-all ${
                        selectedWarehouse === wh.code
                          ? "border-queens-purple bg-queens-purple/5"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          selectedWarehouse === wh.code ? "bg-queens-purple text-white" : "bg-slate-100"
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
                  No shipping warehouses available. Contact admin.
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => { setSetupCommitment(null); setSelectedWarehouse(""); }}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSetupAndRequestLabel}
                  disabled={!selectedWarehouse || settingUp}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {settingUp ? "Setting up..." : "Set & Request Label"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Commitments that need delivery setup */}
      {needsSetupCommitments.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-purple-600 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Needs Delivery Setup ({needsSetupCommitments.length})
          </h2>
          <div className="space-y-3">
            {needsSetupCommitments.map((c) => (
              <div key={c.id} className="bg-purple-50 rounded-xl border border-purple-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{c.deal.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                      <span>Qty: {c.quantity}</span>
                      <span className="text-purple-600">No delivery method set</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => { setSetupCommitment(c); setSelectedWarehouse(""); }}
                    size="sm"
                    variant="purple"
                  >
                    <Truck className="w-4 h-4 mr-2" />
                    Ship & Request Label
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Commitments (already set to SHIP) */}
      {commitments.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Available for Label Request ({commitments.length})
          </h2>
          <div className="space-y-3">
            {commitments.map((c) => {
              const qualifies = c.deal.freeLabelMin && c.quantity >= c.deal.freeLabelMin;
              
              return (
                <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{c.deal.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                        <span>Qty: {c.quantity}</span>
                        <span>Warehouse: {c.warehouse}</span>
                        {qualifies ? (
                          <span className="text-green-600">✓ Free label</span>
                        ) : c.deal.freeLabelMin && (
                          <span className="text-orange-600">
                            Need {c.deal.freeLabelMin}+ for free
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleRequestLabel(c.id)}
                      disabled={requesting === c.id}
                      size="sm"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {requesting === c.id ? 'Requesting...' : 'Request Label'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-yellow-600 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending Requests ({pendingRequests.length})
          </h2>
          <div className="space-y-3">
            {pendingRequests.map((r) => (
              <div key={r.id} className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{r.commitment.deal.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                      <span>Qty: {r.commitment.quantity}</span>
                      <span>Warehouse: {r.commitment.warehouse}</span>
                      <span className="text-yellow-600">Awaiting approval</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCancelModal(r)}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved Labels */}
      {approvedRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-green-600 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Approved Labels ({approvedRequests.length})
          </h2>
          <div className="space-y-3">
            {approvedRequests.map((r) => (
              <div key={r.id} className="bg-green-50 rounded-xl border border-green-200 p-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{r.commitment.deal.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                      <span>Qty: {r.commitment.quantity}</span>
                      <span>Warehouse: {r.commitment.warehouse}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {r.labelFiles && r.labelFiles.length > 0 ? (
                      r.labelFiles.map((file, idx) => (
                        <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant={idx === 0 ? "default" : "outline"}>
                            <FileText className="w-4 h-4 mr-1" />
                            {file.name.length > 15 ? file.name.slice(0, 15) + '...' : file.name}
                          </Button>
                        </a>
                      ))
                    ) : r.labelUrl && (
                      <a href={r.labelUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm">
                          <FileText className="w-4 h-4 mr-2" />
                          Download Label
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rejected */}
      {rejectedRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-2">
            <X className="w-4 h-4" />
            Rejected ({rejectedRequests.length})
          </h2>
          <div className="space-y-3">
            {rejectedRequests.map((r) => (
              <div key={r.id} className="bg-red-50 rounded-xl border border-red-200 p-4">
                <div>
                  <p className="font-medium text-slate-900">{r.commitment.deal.title}</p>
                  {r.notes && <p className="text-sm text-red-600 mt-1">Reason: {r.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {commitments.length === 0 && needsSetupCommitments.length === 0 && labelRequests.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">No label requests</p>
          <p className="text-sm text-slate-400 mt-1">Commit to deals first, then request labels</p>
        </div>
      )}
    </div>
  );
}
