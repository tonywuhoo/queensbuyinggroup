"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Package, 
  Users, 
  Tag, 
  FileText, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  Truck
} from "lucide-react";

interface Stats {
  totalDeals: number;
  activeDeals: number;
  totalUsers: number;
  pendingLabels: number;
  pendingDropoffs: number;
  inTransit: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [dealsRes, usersRes, labelsRes, commitmentsRes] = await Promise.all([
          fetch('/api/admin/deals'),
          fetch('/api/admin/users'),
          fetch('/api/admin/labels?status=PENDING'),
          fetch('/api/admin/commitments')
        ]);

        let totalDeals = 0, activeDeals = 0, totalUsers = 0, pendingLabels = 0, pendingDropoffs = 0, inTransit = 0;

        if (dealsRes.ok) {
          const deals = await dealsRes.json();
          totalDeals = deals.length;
          activeDeals = deals.filter((d: any) => d.status === 'ACTIVE').length;
        }

        if (usersRes.ok) {
          const users = await usersRes.json();
          totalUsers = users.length;
        }

        if (labelsRes.ok) {
          const labels = await labelsRes.json();
          pendingLabels = labels.length;
        }

        if (commitmentsRes.ok) {
          const commitments = await commitmentsRes.json();
          pendingDropoffs = commitments.filter((c: any) => c.status === 'DROP_OFF_PENDING').length;
          inTransit = commitments.filter((c: any) => c.status === 'IN_TRANSIT').length;
        }

        setStats({ totalDeals, activeDeals, totalUsers, pendingLabels, pendingDropoffs, inTransit });
      } catch (e) {
        console.error('Error fetching stats:', e);
        setStats({ totalDeals: 0, activeDeals: 0, totalUsers: 0, pendingLabels: 0, pendingDropoffs: 0, inTransit: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-queens-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: "Active Deals", value: stats?.activeDeals || 0, icon: <Tag className="w-5 h-5" />, color: "bg-green-500", href: "/admin/deals" },
    { label: "Total Users", value: stats?.totalUsers || 0, icon: <Users className="w-5 h-5" />, color: "bg-blue-500", href: "/admin/users" },
    { label: "Pending Labels", value: stats?.pendingLabels || 0, icon: <FileText className="w-5 h-5" />, color: "bg-yellow-500", href: "/admin/labels" },
    { label: "Awaiting Drop-offs", value: stats?.pendingDropoffs || 0, icon: <Package className="w-5 h-5" />, color: "bg-purple-500", href: "/admin/dropoffs" },
    { label: "In Transit", value: stats?.inTransit || 0, icon: <Truck className="w-5 h-5" />, color: "bg-indigo-500", href: "/admin/tracking" },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 text-sm">Manage deals, users, and operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4 mb-6">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-all group"
          >
            <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-500">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 lg:p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-queens-purple" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/admin/deals/new"
              className="flex flex-col items-center justify-center p-4 rounded-lg bg-queens-purple/5 hover:bg-queens-purple/10 border border-queens-purple/20 transition-colors text-center"
            >
              <Tag className="w-6 h-6 text-queens-purple mb-2" />
              <span className="text-sm font-medium text-slate-700">New Deal</span>
            </Link>
            <Link
              href="/admin/dropoffs"
              className="flex flex-col items-center justify-center p-4 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-colors text-center"
            >
              <Package className="w-6 h-6 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-slate-700">Process Drop-off</span>
            </Link>
            <Link
              href="/admin/labels"
              className="flex flex-col items-center justify-center p-4 rounded-lg bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 transition-colors text-center"
            >
              <FileText className="w-6 h-6 text-yellow-600 mb-2" />
              <span className="text-sm font-medium text-slate-700">Review Labels</span>
            </Link>
            <Link
              href="/admin/users"
              className="flex flex-col items-center justify-center p-4 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors text-center"
            >
              <Users className="w-6 h-6 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-slate-700">Manage Users</span>
            </Link>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 lg:p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            Items Requiring Attention
          </h2>
          
          {((stats?.pendingLabels || 0) > 0 || (stats?.pendingDropoffs || 0) > 0) ? (
            <div className="space-y-3">
              {(stats?.pendingLabels || 0) > 0 && (
                <Link href="/admin/labels" className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors">
                  <FileText className="w-5 h-5 text-yellow-600" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{stats?.pendingLabels} label requests</p>
                    <p className="text-sm text-slate-500">Awaiting approval</p>
                  </div>
                </Link>
              )}
              {(stats?.pendingDropoffs || 0) > 0 && (
                <Link href="/admin/dropoffs" className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors">
                  <Package className="w-5 h-5 text-orange-600" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{stats?.pendingDropoffs} drop-offs</p>
                    <p className="text-sm text-slate-500">Awaiting pickup</p>
                  </div>
                </Link>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center p-6 text-slate-500">
              <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
              All caught up!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
