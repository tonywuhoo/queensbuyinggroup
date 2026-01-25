"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Tag, Clock, DollarSign, TrendingUp, Package, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

type DealType = "ALL" | "ABOVE_RETAIL" | "RETAIL" | "BELOW_COST";
type DealStatus = "ACTIVE" | "EXPIRED";

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
  status: string;
  deadline?: string;
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<DealType>("ALL");
  const [statusFilter, setStatusFilter] = useState<DealStatus>("ACTIVE");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const res = await fetch('/api/deals?includeExpired=true');
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
    // Status filter
    const isExpired = deal.status === 'EXPIRED' || (deal.deadline && new Date(deal.deadline) < new Date());
    if (statusFilter === 'ACTIVE' && isExpired) return false;
    if (statusFilter === 'EXPIRED' && !isExpired) return false;
    
    // Type filter
    if (typeFilter !== 'ALL' && deal.priceType !== typeFilter) return false;
    
    // Search filter
    if (search && !deal.title.toLowerCase().includes(search.toLowerCase())) return false;
    
    return true;
  });

  const typeFilters: { value: DealType; label: string; color: string }[] = [
    { value: "ALL", label: "All", color: "bg-slate-600" },
    { value: "ABOVE_RETAIL", label: "Above Retail", color: "bg-green-600" },
    { value: "RETAIL", label: "Retail", color: "bg-blue-600" },
    { value: "BELOW_COST", label: "Below Cost", color: "bg-orange-600" },
  ];

  if (loading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-queens-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Deals</h1>
        <p className="text-slate-500 text-sm">{filteredDeals.length} deals available</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search deals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-queens-purple/20"
            />
          </div>
          
          {/* Status Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === "ACTIVE" ? "bg-queens-purple text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter("EXPIRED")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === "EXPIRED" ? "bg-slate-600 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              Expired
            </button>
          </div>
        </div>

        {/* Type Filters */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {typeFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setTypeFilter(filter.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                typeFilter === filter.value ? `${filter.color} text-white` : "bg-slate-100 text-slate-600"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Deals Grid */}
      {filteredDeals.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredDeals.map((deal) => {
            const profit = Number(deal.payout) - Number(deal.retailPrice);
            const profitPercent = ((profit / Number(deal.retailPrice)) * 100).toFixed(1);
            const isExpired = deal.status === 'EXPIRED' || (deal.deadline && new Date(deal.deadline) < new Date());

            return (
              <Link
                key={deal.id}
                href={`/dashboard/deals/${deal.id}`}
                className={`bg-white rounded-xl border p-5 hover:shadow-lg transition-all ${
                  isExpired ? "border-slate-300 opacity-75" : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-queens-purple/10 text-queens-purple px-2 py-0.5 rounded">
                        {deal.dealId}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        deal.priceType === 'ABOVE_RETAIL' ? 'bg-green-100 text-green-700' :
                        deal.priceType === 'RETAIL' ? 'bg-blue-100 text-blue-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {deal.priceType === 'ABOVE_RETAIL' ? 'Above Retail' :
                         deal.priceType === 'RETAIL' ? 'Retail' : 'Below Cost'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 truncate mt-2">{deal.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-1 mt-1">{deal.description}</p>
                  </div>
                </div>

                {/* Price Info */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-slate-900">${Number(deal.retailPrice).toFixed(0)}</p>
                    <p className="text-xs text-slate-500">Retail</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-green-600">${Number(deal.payout).toFixed(0)}</p>
                    <p className="text-xs text-slate-500">Payout</p>
                  </div>
                  <div className={`rounded-lg p-3 text-center ${profit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <p className={`text-lg font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {profit >= 0 ? '+' : ''}{profitPercent}%
                    </p>
                    <p className="text-xs text-slate-500">Profit</p>
                  </div>
                </div>

                {/* Meta Info */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3 text-slate-500">
                    {deal.limitPerVendor && (
                      <span className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {deal.limitPerVendor}/vendor
                      </span>
                    )}
                    {deal.freeLabelMin && (
                      <span className="text-green-600">
                        {deal.freeLabelMin}+ free label
                      </span>
                    )}
                  </div>
                  {deal.deadline && (
                    <span className={`flex items-center gap-1 ${isExpired ? 'text-red-500' : 'text-slate-500'}`}>
                      <Clock className="w-3 h-3" />
                      {isExpired ? 'Expired' : new Date(deal.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Tag className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">No deals found</p>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
