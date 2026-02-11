"use client";

import { useState, useEffect } from "react";
import { Search, Package, Filter, ExternalLink, CheckCircle, XCircle, Truck, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface WarehouseOption {
  id: string;
  label: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-amber-100 text-amber-700" },
  IN_TRANSIT: { label: "In Transit", color: "bg-blue-100 text-blue-700" },
  DELIVERED: { label: "Delivered", color: "bg-emerald-100 text-emerald-700" },
  FULFILLED: { label: "Fulfilled", color: "bg-purple-100 text-purple-700" },
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-700" },
};

const carrierUrls: Record<string, string> = {
  FEDEX: "https://www.fedex.com/fedextrack/?trknbr=",
  UPS: "https://www.ups.com/track?tracknum=",
  USPS: "https://tools.usps.com/go/TrackConfirmAction?tLabels=",
};

interface TrackingData {
  id: string;
  trackingNumber: string;
  carrier: string;
  lastStatus?: string;
  lastLocation?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    vendorId: string;
  };
  commitment: {
    id: string;
    quantity: number;
    warehouse: string;
    status: string;
    deal: {
      id: string;
      title: string;
      dealId: string;
      payout: number;
    };
  };
}

export default function AdminTrackingPage() {
  const [trackings, setTrackings] = useState<TrackingData[]>([]);
  const [warehouseOptions, setWarehouseOptions] = useState<WarehouseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeWarehouse, setActiveWarehouse] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchTrackings = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (activeWarehouse !== "ALL") params.set("warehouse", activeWarehouse);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/admin/tracking?${params}`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setTrackings(data);
      } else {
        setError("Failed to fetch tracking data");
      }
    } catch (e) {
      console.error("Error fetching trackings:", e);
      setError("Error loading tracking data");
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await fetch('/api/warehouses?all=true');
      if (res.ok) {
        const data = await res.json();
        const options: WarehouseOption[] = [
          { id: "ALL", label: "All" },
          ...data.map((wh: any) => ({ 
            id: wh.code, 
            label: wh.isActive ? wh.code : `${wh.code} (inactive)` 
          })),
        ];
        setWarehouseOptions(options);
      }
    } catch (e) {
      console.error('Error fetching warehouses:', e);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    fetchTrackings();
  }, [activeWarehouse, statusFilter]);

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchTrackings();
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleStatusUpdate = async (trackingId: string, newStatus: "DELIVERED" | "FULFILLED" | "CANCELLED") => {
    setUpdatingId(trackingId);
    try {
      const res = await fetch("/api/admin/tracking", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          trackingId,
          commitmentStatus: newStatus,
        }),
      });

      if (res.ok) {
        fetchTrackings();
      } else {
        setError("Failed to update status");
      }
    } catch (e) {
      setError("Error updating status");
    } finally {
      setUpdatingId(null);
    }
  };

  const getTrackingUrl = (carrier: string, trackingNumber: string) => {
    const baseUrl = carrierUrls[carrier];
    return baseUrl ? `${baseUrl}${trackingNumber}` : null;
  };

  const filteredTrackings = trackings;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">All Tracking</h1>
          <p className="text-slate-500 mt-1">View and manage all submitted tracking numbers</p>
        </div>
        <Button variant="outline" onClick={fetchTrackings} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="space-y-4 mb-6">
        {/* Warehouse Filter */}
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">Warehouse:</span>
            <div className="flex gap-2 flex-wrap">
              {warehouseOptions.map((wh) => (
                <button
                  key={wh.id}
                  onClick={() => setActiveWarehouse(wh.id)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeWarehouse === wh.id
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {wh.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search and Status */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-white rounded-xl border border-slate-200">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search tracking #, vendor, or deal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 border-0 bg-transparent focus-visible:ring-0 h-12"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-2 flex-wrap">
            <Filter className="w-5 h-5 text-slate-400 ml-2" />
            {["ALL", "IN_TRANSIT", "DELIVERED", "FULFILLED"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === status
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {status === "ALL" ? "All" : status.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">
            Tracking Records ({filteredTrackings.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
          </div>
        ) : filteredTrackings.length === 0 ? (
          <div className="p-12 text-center">
            <Truck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">No tracking records found</p>
            <p className="text-sm text-slate-400 mt-1">Tracking will appear here when vendors submit shipments</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Vendor</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Tracking #</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Deal</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Carrier</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Warehouse</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Qty</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Submitted</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTrackings.map((tracking) => {
                  const status = statusConfig[tracking.commitment.status] || statusConfig.PENDING;
                  const trackUrl = getTrackingUrl(tracking.carrier, tracking.trackingNumber);
                  const isUpdating = updatingId === tracking.id;
                  return (
                    <tr key={tracking.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900">{tracking.user.name}</p>
                          <p className="text-sm text-slate-500 font-mono">{tracking.user.vendorId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-mono text-sm text-slate-900">{tracking.trackingNumber}</span>
                          {tracking.lastStatus && (
                            <p className="text-xs text-slate-500 mt-1">{tracking.lastStatus}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className="text-sm text-slate-700">{tracking.commitment.deal.title}</span>
                          <p className="text-xs text-slate-500 font-mono">{tracking.commitment.deal.dealId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          tracking.carrier === "FEDEX" ? "bg-purple-100 text-purple-700" :
                          tracking.carrier === "UPS" ? "bg-amber-100 text-amber-700" :
                          "bg-blue-100 text-blue-700"
                        }`}>
                          {tracking.carrier}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-900">{tracking.commitment.warehouse}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-900">{tracking.commitment.quantity}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={status.color}>{status.label}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500">
                          {new Date(tracking.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {trackUrl && (
                            <a href={trackUrl} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm" title="Track Package">
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </a>
                          )}
                          {tracking.commitment.status === "IN_TRANSIT" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-emerald-600 hover:bg-emerald-50"
                              title="Mark as Delivered"
                              onClick={() => handleStatusUpdate(tracking.id, "DELIVERED")}
                              disabled={isUpdating}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          {tracking.commitment.status === "DELIVERED" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-purple-600 hover:bg-purple-50"
                              title="Mark as Fulfilled"
                              onClick={() => handleStatusUpdate(tracking.id, "FULFILLED")}
                              disabled={isUpdating}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          {tracking.commitment.status !== "FULFILLED" && tracking.commitment.status !== "CANCELLED" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:bg-red-50"
                              title="Cancel"
                              onClick={() => handleStatusUpdate(tracking.id, "CANCELLED")}
                              disabled={isUpdating}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
