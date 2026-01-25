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
}

export default function AdminLayout({
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
          
          // Only allow admins
          if (data.role !== "ADMIN") {
            router.replace("/dashboard");
            return;
          }
          
          setProfile({
            firstName: data.firstName || user.email?.split("@")[0] || "Admin",
            lastName: data.lastName || "",
            email: data.email || user.email || "",
            vendorId: data.vendorId || "U-00001",
            role: "ADMIN",
          });
        } else {
          // Fallback to metadata if profile fetch fails
          const meta = user.user_metadata;
          if (meta?.role !== "ADMIN") {
            router.replace("/dashboard");
            return;
          }
          setProfile({
            firstName: meta?.first_name || user.email?.split("@")[0] || "Admin",
            lastName: meta?.last_name || "",
            email: user.email || "",
            vendorId: meta?.vendor_id || "U-00001",
            role: "ADMIN",
          });
        }
      } catch (e) {
        console.error("Error loading profile:", e);
        // Fallback to metadata
        const meta = user.user_metadata;
        if (meta?.role !== "ADMIN") {
          router.replace("/dashboard");
          return;
        }
        setProfile({
          firstName: meta?.first_name || user.email?.split("@")[0] || "Admin",
          lastName: meta?.last_name || "",
          email: user.email || "",
          vendorId: meta?.vendor_id || "U-00001",
          role: "ADMIN",
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
        role="ADMIN"
        user={{
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          vendorId: profile.vendorId,
        }}
      />
      <main className="pt-14 lg:pt-0 lg:pl-64">
        {children}
      </main>
    </div>
  );
}
