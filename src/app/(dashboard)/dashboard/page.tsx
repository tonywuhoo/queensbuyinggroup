"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Tag, 
  Package, 
  FileText, 
  Truck,
  HelpCircle,
  ChevronRight,
  DollarSign,
  Clock,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Deal {
  id: string;
  title: string;
  retailPrice: number;
  payout: number;
  deadline?: string;
  status: string;
  isExclusive?: boolean;
  exclusivePrice?: number;
}

interface Commitment {
  id: string;
  status: string;
  deal: { title: string };
}

export default function SellerDashboard() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [isExclusiveMember, setIsExclusiveMember] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dealsRes, commitmentsRes, profileRes] = await Promise.all([
          fetch('/api/deals?status=ACTIVE'),
          fetch('/api/commitments'),
          fetch('/api/profile')
        ]);
        
        if (dealsRes.ok) {
          const dealsData = await dealsRes.json();
          setDeals(dealsData.slice(0, 5)); // Show top 5
        }
        
        if (commitmentsRes.ok) {
          const commitmentsData = await commitmentsRes.json();
          setCommitments(commitmentsData);
        }
        
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setIsExclusiveMember(profileData.isExclusiveMember || false);
        }
      } catch (e) {
        console.error('Error fetching dashboard data:', e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const pendingCommitments = commitments.filter(c => c.status === 'PENDING').length;
  const inTransitCommitments = commitments.filter(c => c.status === 'IN_TRANSIT').length;

  const quickActions = [
    { label: "Browse Deals", href: "/dashboard/deals", icon: <Tag className="w-5 h-5" />, color: "bg-queens-purple" },
    { label: "My Commitments", href: "/dashboard/commitments", icon: <Package className="w-5 h-5" />, color: "bg-blue-600" },
    { label: "Submit Tracking", href: "/dashboard/submit-tracking", icon: <Truck className="w-5 h-5" />, color: "bg-green-600" },
    { label: "Request Label", href: "/dashboard/labels", icon: <FileText className="w-5 h-5" />, color: "bg-orange-500" },
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
      {/* Header with Help */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm">Welcome back! Here's your overview.</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowHelp(true)}
          className="gap-2"
        >
          <HelpCircle className="w-4 h-4" />
          How It Works
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <p className="text-2xl font-bold text-slate-900">{deals.length}</p>
          <p className="text-xs text-slate-500">Active Deals</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <p className="text-2xl font-bold text-yellow-600">{pendingCommitments}</p>
          <p className="text-xs text-slate-500">Pending</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <p className="text-2xl font-bold text-blue-600">{inTransitCommitments}</p>
          <p className="text-xs text-slate-500">In Transit</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <p className="text-2xl font-bold text-green-600">{commitments.filter(c => c.status === 'FULFILLED').length}</p>
          <p className="text-xs text-slate-500">Fulfilled</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-all group"
          >
            <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}>
              {action.icon}
            </div>
            <p className="font-medium text-slate-900 text-sm">{action.label}</p>
          </Link>
        ))}
      </div>

      {/* Active Deals */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Active Deals</h2>
          <Link href="/dashboard/deals" className="text-sm text-queens-purple hover:underline flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        {deals.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {deals.map((deal) => {
              // Use VIP pricing if applicable
              const showVipPricing = isExclusiveMember && deal.isExclusive && deal.exclusivePrice;
              const displayPayout = showVipPricing ? Number(deal.exclusivePrice) : Number(deal.payout);
              const profit = displayPayout - Number(deal.retailPrice);
              const profitPercent = ((profit / Number(deal.retailPrice)) * 100).toFixed(1);
              
              return (
                <Link
                  key={deal.id}
                  href={`/dashboard/deals/${deal.id}`}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 truncate flex items-center gap-2">
                      {deal.title}
                      {showVipPricing && <Star className="w-3 h-3 text-amber-500" />}
                    </p>
                    <div className="flex items-center gap-4 mt-1 text-sm">
                      <span className="text-slate-500">
                        <DollarSign className="w-3 h-3 inline" />
                        {Number(deal.retailPrice).toFixed(0)} retail
                      </span>
                      <span className={`font-medium ${showVipPricing ? 'text-amber-600' : 'text-green-600'}`}>
                        ${displayPayout.toFixed(0)} payout
                      </span>
                      <span className={`font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {profit >= 0 ? '+' : ''}{profitPercent}%
                      </span>
                    </div>
                  </div>
                  {deal.deadline && (
                    <div className="text-right text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(deal.deadline).toLocaleDateString()}
                    </div>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-400 ml-2" />
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500">
            <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No active deals right now</p>
            <p className="text-sm mt-1">Check back soon for new opportunities!</p>
          </div>
        )}
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowHelp(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">How It Works</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-queens-purple text-white flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                <div>
                  <p className="font-medium text-slate-900">Browse Deals</p>
                  <p className="text-sm text-slate-500">Find products with great payouts</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-queens-purple text-white flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                <div>
                  <p className="font-medium text-slate-900">Commit to a Deal</p>
                  <p className="text-sm text-slate-500">Choose Ship or Drop-off delivery</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-queens-purple text-white flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                <div>
                  <p className="font-medium text-slate-900">Ship or Drop-off</p>
                  <p className="text-sm text-slate-500">Request a label or visit a warehouse</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">4</div>
                <div>
                  <p className="font-medium text-slate-900">Get Paid!</p>
                  <p className="text-sm text-slate-500">Receive your payout via invoice</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100">
              <Button onClick={() => setShowHelp(false)} className="w-full">Got it!</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
