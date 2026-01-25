"use client";

import { useState } from "react";
import { Search, Package, Filter, ExternalLink, CheckCircle, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const WAREHOUSES = [
  { id: "ALL", label: "All" },
  { id: "MA", label: "MA" },
  { id: "NJ", label: "NJ" },
  { id: "CT", label: "CT" },
  { id: "DE", label: "DE" },
];

// Mock tracking data
const mockTrackings = [
  { id: "1", user: "John Doe", vendorId: "U-00001", trackingId: "492732392120", carrier: "FedEx", status: "DELIVERED", warehouse: "DE", dealTitle: "iPhone 15 Pro Max", quantity: 5, submittedAt: "Dec 24, 2025" },
  { id: "2", user: "Jane Smith", vendorId: "U-00002", trackingId: "492732393929", carrier: "FedEx", status: "DELIVERED", warehouse: "MA", dealTitle: "AirPods Pro 2", quantity: 10, submittedAt: "Dec 22, 2025" },
  { id: "3", user: "Mike Johnson", vendorId: "U-00004", trackingId: "492732392153", carrier: "USPS", status: "IN_TRANSIT", warehouse: "NJ", dealTitle: "MacBook Air M3", quantity: 2, submittedAt: "Dec 22, 2025" },
  { id: "4", user: "John Doe", vendorId: "U-00001", trackingId: "492732399999", carrier: "UPS", status: "PENDING", warehouse: "CT", dealTitle: "iPad Pro 12.9", quantity: 3, submittedAt: "Dec 21, 2025" },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-amber-100 text-amber-700" },
  IN_TRANSIT: { label: "In Transit", color: "bg-blue-100 text-blue-700" },
  DELIVERED: { label: "Delivered", color: "bg-emerald-100 text-emerald-700" },
  FULFILLED: { label: "Fulfilled", color: "bg-purple-100 text-purple-700" },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-700" },
};

const carrierUrls: Record<string, string> = {
  FedEx: "https://www.fedex.com/fedextrack/?trknbr=",
  UPS: "https://www.ups.com/track?tracknum=",
  USPS: "https://tools.usps.com/go/TrackConfirmAction?tLabels=",
  DHL: "https://www.dhl.com/en/express/tracking.html?AWB=",
};

export default function AdminTrackingPage() {
  const [activeWarehouse, setActiveWarehouse] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTrackings = mockTrackings.filter((t) => {
    const matchesWarehouse = activeWarehouse === "ALL" || t.warehouse === activeWarehouse;
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    const matchesSearch = 
      t.trackingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.vendorId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.dealTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesWarehouse && matchesStatus && matchesSearch;
  });

  const getTrackingUrl = (carrier: string, trackingId: string) => {
    const baseUrl = carrierUrls[carrier];
    return baseUrl ? `${baseUrl}${trackingId}` : null;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">All Tracking</h1>
        <p className="text-slate-500 mt-1">View and manage all submitted tracking numbers</p>
      </div>

      {/* Filters */}
      <div className="space-y-4 mb-6">
        {/* Warehouse Filter */}
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">Warehouse:</span>
            <div className="flex gap-2">
              {WAREHOUSES.map((wh) => (
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
                placeholder="Search tracking ID, user, or deal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 border-0 bg-transparent focus-visible:ring-0 h-12"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-2">
            <Filter className="w-5 h-5 text-slate-400 ml-2" />
            {["ALL", "PENDING", "IN_TRANSIT", "DELIVERED", "FULFILLED"].map((status) => (
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

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">User</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Tracking ID</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Deal</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Carrier</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Warehouse</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Qty</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTrackings.map((tracking) => {
                const status = statusConfig[tracking.status] || statusConfig.PENDING;
                const trackUrl = getTrackingUrl(tracking.carrier, tracking.trackingId);
                return (
                  <tr key={tracking.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{tracking.user}</p>
                        <p className="text-sm text-slate-500 font-mono">{tracking.vendorId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-slate-900">{tracking.trackingId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-700">{tracking.dealTitle}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{tracking.carrier}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-900">{tracking.warehouse}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-900">{tracking.quantity}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={status.color}>{status.label}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {trackUrl && (
                          <a href={trackUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                        {tracking.status !== "FULFILLED" && tracking.status !== "REJECTED" && (
                          <>
                            <Button variant="ghost" size="sm" className="text-emerald-600 hover:bg-emerald-50" title="Mark as Fulfilled">
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" title="Reject">
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
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
    </div>
  );
}
