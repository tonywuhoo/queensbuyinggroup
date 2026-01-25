"use client";

import { useState, useEffect } from "react";
import { FileText, DollarSign, ExternalLink, Clock, CheckCircle, AlertCircle, Search, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Invoice {
  id: string;
  skynovaUrl: string;
  amount: number;
  status: string;
  checkNumber?: string;
  checkImageUrl?: string;
  notes?: string;
  createdAt: string;
  paidAt?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    vendorNumber: number;
  };
  commitment: {
    id: string;
    quantity: number;
    deal: {
      title: string;
    };
  };
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "PAID">("ALL");
  const [search, setSearch] = useState("");
  
  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editStatus, setEditStatus] = useState("PENDING");
  const [editCheckNumber, setEditCheckNumber] = useState("");
  const [editCheckImageUrl, setEditCheckImageUrl] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await fetch('/api/admin/invoices');
        if (res.ok) {
          const data = await res.json();
          setInvoices(data);
        }
      } catch (e) {
        console.error('Error fetching invoices:', e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter((inv) => {
    if (filter !== "ALL" && inv.status !== filter) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        inv.user.firstName.toLowerCase().includes(searchLower) ||
        inv.user.lastName.toLowerCase().includes(searchLower) ||
        inv.user.email.toLowerCase().includes(searchLower) ||
        `U-${String(inv.user.vendorNumber).padStart(5, '0')}`.toLowerCase().includes(searchLower) ||
        inv.commitment.deal.title.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const openEditModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setEditStatus(invoice.status);
    setEditCheckNumber(invoice.checkNumber || "");
    setEditCheckImageUrl(invoice.checkImageUrl || "");
    setEditNotes(invoice.notes || "");
    setEditModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedInvoice) return;
    
    setSaving(true);
    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedInvoice.id,
          status: editStatus,
          checkNumber: editCheckNumber || null,
          checkImageUrl: editCheckImageUrl || null,
          notes: editNotes || null,
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setInvoices(invoices.map(inv => 
          inv.id === selectedInvoice.id ? { ...inv, ...updated } : inv
        ));
        setEditModalOpen(false);
        setSelectedInvoice(null);
      }
    } catch (e) {
      console.error('Error updating invoice:', e);
    } finally {
      setSaving(false);
    }
  };

  const pendingCount = invoices.filter(i => i.status === "PENDING").length;
  const totalPending = invoices.filter(i => i.status === "PENDING").reduce((sum, i) => sum + Number(i.amount), 0);
  const totalPaid = invoices.filter(i => i.status === "PAID").reduce((sum, i) => sum + Number(i.amount), 0);

  if (loading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-queens-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Manage Invoices</h1>
        <p className="text-slate-500 text-sm">
          {pendingCount > 0 && <span className="text-yellow-600 font-medium">{pendingCount} pending</span>}
          {pendingCount > 0 && " · "}
          ${totalPending.toLocaleString()} unpaid · ${totalPaid.toLocaleString()} paid
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search vendor, deal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-queens-purple/20"
          />
        </div>
        <div className="flex gap-2">
          {(["ALL", "PENDING", "PAID"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-queens-purple text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List */}
      <div className="space-y-3">
        {filteredInvoices.map((invoice) => (
          <div key={invoice.id} className={`bg-white rounded-xl border p-4 ${
            invoice.status === "PENDING" ? "border-yellow-200" : "border-slate-200"
          }`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Vendor Info */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-queens-purple/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-queens-purple font-bold text-sm">
                      {invoice.user.firstName[0]}{invoice.user.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {invoice.user.firstName} {invoice.user.lastName}
                      <span className="ml-2 font-mono text-xs text-queens-purple">
                        U-{String(invoice.user.vendorNumber).padStart(5, '0')}
                      </span>
                    </p>
                    <p className="text-sm text-slate-500">{invoice.commitment.deal.title}</p>
                  </div>
                </div>

                {/* Invoice Details */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3 h-3" />
                    {new Date(invoice.createdAt).toLocaleDateString()}
                  </span>
                  <span className="font-medium text-green-600 text-lg">
                    ${Number(invoice.amount).toLocaleString()}
                  </span>
                  {invoice.status === "PAID" ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Paid {invoice.paidAt && `· ${new Date(invoice.paidAt).toLocaleDateString()}`}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Pending
                    </span>
                  )}
                  {invoice.checkNumber && (
                    <span className="text-slate-600">Check #{invoice.checkNumber}</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <a href={invoice.skynovaUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline">
                    <ExternalLink className="w-3 h-3 mr-2" />
                    Skynova
                  </Button>
                </a>
                <Button size="sm" onClick={() => openEditModal(invoice)}>
                  <Edit className="w-3 h-3 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          </div>
        ))}

        {filteredInvoices.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No {filter.toLowerCase()} invoices found</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setEditModalOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Edit Invoice</h2>
              <p className="text-sm text-slate-500">{selectedInvoice.commitment.deal.title}</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditStatus("PENDING")}
                    className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                      editStatus === "PENDING"
                        ? "bg-yellow-100 text-yellow-700 border-2 border-yellow-300"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 inline mr-2" />
                    Pending
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditStatus("PAID")}
                    className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                      editStatus === "PAID"
                        ? "bg-green-100 text-green-700 border-2 border-green-300"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    Paid
                  </button>
                </div>
              </div>

              {/* Check Number */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Check Number
                </label>
                <input
                  type="text"
                  value={editCheckNumber}
                  onChange={(e) => setEditCheckNumber(e.target.value)}
                  placeholder="e.g. 1234"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-queens-purple/20"
                />
              </div>

              {/* Check Image URL */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Check Image URL (optional)
                </label>
                <input
                  type="url"
                  value={editCheckImageUrl}
                  onChange={(e) => setEditCheckImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-queens-purple/20"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Any notes..."
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-queens-purple/20"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200"
                >
                  Cancel
                </button>
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
