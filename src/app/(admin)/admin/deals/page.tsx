"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Search, X, AlertTriangle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

type DealStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "EXPIRED" | "CLOSED";

interface Deal {
  id: string;
  dealId: string;
  dealNumber: number;
  title: string;
  description: string;
  imageUrl?: string;
  retailPrice: number;
  payout: number;
  priceType: string;
  limitPerVendor?: number;
  freeLabelMin?: number;
  status: DealStatus;
  deadline?: string;
  stats: {
    totalCommitments: number;
    totalQuantity: number;
    fulfilled: number;
  };
}

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | DealStatus>("ALL");
  const [search, setSearch] = useState("");
  
  // Delete confirmation modal
  const [deleteModal, setDeleteModal] = useState<Deal | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const res = await fetch('/api/admin/deals');
        if (res.ok) {
          const data = await res.json();
          setDeals(data);
        }
      } catch (e) {
        console.error('Error fetching deals:', e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDeals();
  }, []);

  const filteredDeals = deals.filter((deal) => {
    const matchesFilter = filter === "ALL" || deal.status === filter;
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      deal.title.toLowerCase().includes(searchLower) ||
      deal.dealId?.toLowerCase().includes(searchLower);
    return matchesFilter && matchesSearch;
  });

  const statusColors: Record<DealStatus, string> = {
    DRAFT: "bg-slate-100 text-slate-700",
    ACTIVE: "bg-green-100 text-green-700",
    PAUSED: "bg-yellow-100 text-yellow-700",
    EXPIRED: "bg-red-100 text-red-700",
    CLOSED: "bg-slate-100 text-slate-700",
  };

  const handleStatusChange = async (dealId: string, newStatus: DealStatus) => {
    try {
      const res = await fetch('/api/admin/deals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: dealId, status: newStatus })
      });
      
      if (res.ok) {
        setDeals(deals.map(d => d.id === dealId ? { ...d, status: newStatus } : d));
      }
    } catch (e) {
      console.error('Error updating deal:', e);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    
    setDeleting(true);
    setErrorMessage("");
    
    try {
      const res = await fetch(`/api/admin/deals?id=${deleteModal.id}`, { method: 'DELETE' });
      
      if (res.ok) {
        setDeals(deals.filter(d => d.id !== deleteModal.id));
        setDeleteModal(null);
      } else {
        const error = await res.json();
        setErrorMessage(error.error || 'Failed to delete deal');
      }
    } catch (e) {
      console.error('Error deleting deal:', e);
      setErrorMessage('Failed to delete deal');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-queens-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setDeleteModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 text-center mb-2">Delete Deal?</h2>
              <p className="text-sm text-slate-500 text-center mb-2">
                Are you sure you want to delete <strong>{deleteModal.title}</strong>?
              </p>
              <p className="text-xs text-slate-400 text-center mb-4">
                This action cannot be undone.
              </p>
              
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
                  {errorMessage}
                </div>
              )}
              
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setDeleteModal(null)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1 bg-red-600 hover:bg-red-700" 
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Deals</h1>
          <p className="text-slate-500 text-sm">{deals.length} total deals</p>
        </div>
        <Link href="/admin/deals/new">
          <Button className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            New Deal
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search deals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-queens-purple/20 focus:border-queens-purple"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {(["ALL", "ACTIVE", "DRAFT", "PAUSED", "EXPIRED", "CLOSED"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === status
                  ? "bg-queens-purple text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Deals Grid */}
      <div className="grid gap-4">
        {filteredDeals.map((deal) => (
          <div
            key={deal.id}
            className="bg-white rounded-xl border border-slate-200 p-4 lg:p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Product Image */}
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 hidden sm:block">
                {deal.imageUrl ? (
                  <img
                    src={deal.imageUrl}
                    alt={deal.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-slate-300" />
                  </div>
                )}
              </div>

              {/* Deal Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-queens-purple/10 text-queens-purple px-2 py-0.5 rounded">
                      {deal.dealId}
                    </span>
                    <h3 className="font-semibold text-slate-900 truncate">{deal.title}</h3>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[deal.status]}`}>
                    {deal.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1 line-clamp-1">{deal.description}</p>
                
                <div className="flex flex-wrap gap-4 mt-3 text-sm">
                  <div>
                    <span className="text-slate-500">Retail:</span>{" "}
                    <span className="font-medium">${Number(deal.retailPrice).toFixed(0)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Payout:</span>{" "}
                    <span className="font-medium text-green-600">${Number(deal.payout).toFixed(0)}</span>
                  </div>
                  {deal.limitPerVendor && (
                    <div>
                      <span className="text-slate-500">Limit:</span>{" "}
                      <span className="font-medium">{deal.limitPerVendor}/vendor</span>
                    </div>
                  )}
                  {deal.deadline && (
                    <div>
                      <span className="text-slate-500">Deadline:</span>{" "}
                      <span className="font-medium">{new Date(deal.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 lg:gap-8 py-3 lg:py-0 border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900">{deal.stats?.totalCommitments || 0}</p>
                  <p className="text-xs text-slate-500">Commitments</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900">{deal.stats?.totalQuantity || 0}</p>
                  <p className="text-xs text-slate-500">Qty</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{deal.stats?.fulfilled || 0}</p>
                  <p className="text-xs text-slate-500">Fulfilled</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <select
                  value={deal.status}
                  onChange={(e) => handleStatusChange(deal.id, e.target.value as DealStatus)}
                  className="flex-1 lg:flex-none px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PAUSED">Paused</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="CLOSED">Closed</option>
                </select>
                <Link
                  href={`/admin/deals/${deal.id}`}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <Edit className="w-4 h-4 text-slate-600" />
                </Link>
                <button
                  onClick={() => setDeleteModal(deal)}
                  className="p-2 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredDeals.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <p>No deals found</p>
            <Link href="/admin/deals/new">
              <Button className="mt-4">Create First Deal</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
