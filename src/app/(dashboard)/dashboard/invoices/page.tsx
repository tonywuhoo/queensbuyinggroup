"use client";

import { useState, useEffect } from "react";
import { FileText, DollarSign, ExternalLink, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Invoice {
  id: string;
  skynovaUrl: string;
  amount: number;
  status: string;
  checkNumber?: string;
  createdAt: string;
  paidAt?: string;
  commitment: {
    id: string;
    quantity: number;
    deal: {
      title: string;
    };
  };
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "PAID">("ALL");

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await fetch('/api/invoices');
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

  const filteredInvoices = filter === "ALL" 
    ? invoices 
    : invoices.filter(i => i.status === filter);

  const totalEarnings = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const paidAmount = invoices.filter(i => i.status === 'PAID').reduce((sum, inv) => sum + Number(inv.amount), 0);
  const pendingAmount = invoices.filter(i => i.status === 'PENDING').reduce((sum, inv) => sum + Number(inv.amount), 0);

  if (loading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-queens-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
        <p className="text-slate-500 text-sm">{invoices.length} total invoices</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Total</p>
          <p className="text-xl font-bold text-slate-900">${totalEarnings.toLocaleString()}</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-4">
          <p className="text-xs text-green-600 uppercase tracking-wider">Paid</p>
          <p className="text-xl font-bold text-green-600">${paidAmount.toLocaleString()}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
          <p className="text-xs text-yellow-600 uppercase tracking-wider">Pending</p>
          <p className="text-xl font-bold text-yellow-600">${pendingAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
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

      {/* Invoices List */}
      {filteredInvoices.length > 0 ? (
        <div className="space-y-3">
          {filteredInvoices.map((invoice) => (
            <div key={invoice.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="font-medium text-slate-900 truncate">{invoice.commitment.deal.title}</p>
                    {invoice.status === "PAID" ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Paid
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Pending
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </span>
                    <span className="font-medium text-green-600">
                      ${Number(invoice.amount).toLocaleString()}
                    </span>
                    {invoice.checkNumber && (
                      <span className="text-slate-600">
                        Check #{invoice.checkNumber}
                      </span>
                    )}
                  </div>
                </div>
                <a
                  href={invoice.skynovaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="sm" variant="outline">
                    <ExternalLink className="w-3 h-3 mr-2" />
                    View
                  </Button>
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">No {filter.toLowerCase()} invoices</p>
        </div>
      )}
    </div>
  );
}
