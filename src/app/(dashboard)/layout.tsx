"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { createClient } from "@/lib/supabase/client";

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  vendorId: string;
  role: string;
  discordId?: string;
  discordUsername?: string;
  isExclusiveMember?: boolean;
  exclusiveMemberCheckedAt?: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.replace("/login");
        return;
      }
      
      // Fetch profile from API (which syncs with database)
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          
          // Redirect admin to admin dashboard
          if (data.role === "ADMIN") {
            router.replace("/admin");
            return;
          }
          
          setProfile({
            firstName: data.firstName || user.email?.split("@")[0] || "User",
            lastName: data.lastName || "",
            email: data.email || user.email || "",
            vendorId: data.vendorId || "U-00000",
            role: data.role || "SELLER",
            discordId: data.discordId,
            discordUsername: data.discordUsername,
            isExclusiveMember: data.isExclusiveMember,
            exclusiveMemberCheckedAt: data.exclusiveMemberCheckedAt,
          });
          
          // Auto-refresh Discord membership if > 24 hours old
          if (data.discordId && data.exclusiveMemberCheckedAt) {
            const lastChecked = new Date(data.exclusiveMemberCheckedAt);
            const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            
            if (lastChecked < dayAgo) {
              // Refresh in background
              fetch('/api/profile/discord/refresh', { method: 'POST' })
                .then(res => res.json())
                .then(refreshData => {
                  if (refreshData.isExclusiveMember !== data.isExclusiveMember) {
                    // Update profile if status changed
                    setProfile(prev => prev ? { ...prev, isExclusiveMember: refreshData.isExclusiveMember } : null);
                  }
                })
                .catch(e => console.error('Error refreshing Discord status:', e));
            }
          }
        } else {
          // Fallback to metadata if profile fetch fails
          const meta = user.user_metadata;
          if (meta?.role === "ADMIN") {
            router.replace("/admin");
            return;
          }
          setProfile({
            firstName: meta?.first_name || user.email?.split("@")[0] || "User",
            lastName: meta?.last_name || "",
            email: user.email || "",
            vendorId: meta?.vendor_id || "U-00000",
            role: meta?.role || "SELLER",
            discordUsername: undefined,
            isExclusiveMember: false,
          });
        }
      } catch (e) {
        console.error("Error loading profile:", e);
        // Fallback to metadata
        const meta = user.user_metadata;
        setProfile({
          firstName: meta?.first_name || user.email?.split("@")[0] || "User",
          lastName: meta?.last_name || "",
          email: user.email || "",
          vendorId: meta?.vendor_id || "U-00000",
          role: meta?.role || "SELLER",
          discordUsername: undefined,
          isExclusiveMember: false,
        });
      }
      
      setLoading(false);
    };
    
    loadProfile();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.replace("/login");
      }
    });
    
    return () => subscription.unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-queens-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        role={profile.role as "SELLER" | "ADMIN" | "WORKER"}
        user={{
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          vendorId: profile.vendorId,
          discordUsername: profile.discordUsername,
          isExclusiveMember: profile.isExclusiveMember,
        }}
      />
      <main className="pt-14 lg:pt-0 lg:pl-64">
        {children}
      </main>
    </div>
  );
}
