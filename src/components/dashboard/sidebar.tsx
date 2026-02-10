"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import {
  LayoutDashboard,
  Package,
  Tag,
  Users,
  Settings,
  LogOut,
  FileText,
  Truck,
  History,
  Menu,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  role: "SELLER" | "ADMIN" | "WORKER";
  user: {
    firstName: string;
    lastName: string;
    email: string;
    vendorId?: string;
    discordUsername?: string;
    isExclusiveMember?: boolean;
  };
}

const sellerNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "Deals", href: "/dashboard/deals", icon: <Tag className="w-5 h-5" /> },
  { label: "My Commitments", href: "/dashboard/commitments", icon: <Package className="w-5 h-5" /> },
  { label: "Submit Tracking", href: "/dashboard/submit-tracking", icon: <Truck className="w-5 h-5" /> },
  { label: "Tracking History", href: "/dashboard/tracking", icon: <History className="w-5 h-5" /> },
  { label: "Label Requests", href: "/dashboard/labels", icon: <FileText className="w-5 h-5" /> },
  { label: "Invoices", href: "/dashboard/invoices", icon: <FileText className="w-5 h-5" /> },
];

const adminNavItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "Manage Deals", href: "/admin/deals", icon: <Tag className="w-5 h-5" /> },
  { label: "Users", href: "/admin/users", icon: <Users className="w-5 h-5" /> },
  { label: "Drop-offs", href: "/admin/dropoffs", icon: <Package className="w-5 h-5" /> },
  { label: "All Commitments", href: "/admin/commitments", icon: <Package className="w-5 h-5" /> },
  { label: "Invoices", href: "/admin/invoices", icon: <FileText className="w-5 h-5" /> },
  { label: "Tracking", href: "/admin/tracking", icon: <Truck className="w-5 h-5" /> },
  { label: "Label Requests", href: "/admin/labels", icon: <FileText className="w-5 h-5" /> },
  { label: "Settings", href: "/admin/settings", icon: <Settings className="w-5 h-5" /> },
];

export function Sidebar({ role, user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = role === "ADMIN" ? adminNavItems : sellerNavItems;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = `${user.firstName[0] || ""}${user.lastName[0] || ""}`.toUpperCase() || "U";

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-slate-800">
        <Logo size="sm" className="[&_span]:text-white [&_.text-queens-purple]:text-queens-lavender" />
      </div>

      {/* Vendor ID */}
      {user.vendorId && (
        <div className="px-4 py-3 mx-3 mt-4 rounded-lg bg-slate-800/50 border border-slate-700">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">Vendor ID</p>
          <p className="text-sm font-mono font-bold text-queens-lavender">{user.vendorId}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="px-3 mt-6">
        <p className="text-xs uppercase tracking-wider text-slate-500 font-medium mb-2 px-3">
          {role === "ADMIN" ? "Admin Menu" : "Vendor Menu"}
        </p>
      </div>
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              item.href !== "/admin" &&
              pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-queens-purple text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-queens-purple flex items-center justify-center">
            <span className="text-sm font-semibold text-white">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-white">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
        </div>
        
        {/* Discord Status */}
        {user.discordUsername && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-indigo-900/30 border border-indigo-800/50">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span className="text-xs text-indigo-300 truncate">{user.discordUsername}</span>
              {user.isExclusiveMember && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded font-medium">
                  VIP
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Link 
            href={role === "ADMIN" ? "/admin/settings" : "/dashboard/settings"}
            onClick={() => setMobileOpen(false)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center px-3 py-2 rounded-lg bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-slate-800 px-4 h-14 flex items-center justify-between">
        <Logo size="sm" className="[&_span]:text-white [&_.text-queens-purple]:text-queens-lavender" />
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-slate-800 text-white"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={cn(
        "lg:hidden fixed left-0 top-14 bottom-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          <SidebarContent />
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 z-40 h-screen w-64 bg-slate-900 text-white">
        <div className="flex h-full flex-col">
          <SidebarContent />
        </div>
      </aside>
    </>
  );
}
