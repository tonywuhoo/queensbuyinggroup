import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

interface JWTPayload {
  sub: string;
  email?: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    role?: string;
    vendor_id?: string;
  };
  exp?: number;
}

// Get session from cookie manually (since Supabase SSR has issues)
async function getSessionFromCookie() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  // Find the auth cookie
  const authCookie = allCookies.find(c => c.name.includes('auth-token') && !c.name.includes('.'));
  
  if (!authCookie) {
    console.log("No auth cookie found");
    return null;
  }
  
  try {
    const session = JSON.parse(authCookie.value);
    if (session.access_token) {
      // Decode the JWT to get user info
      const decoded = jwtDecode<JWTPayload>(session.access_token);
      
      // Check if token is expired
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        console.log("Token expired");
        return null;
      }
      
      return {
        access_token: session.access_token,
        user: {
          id: decoded.sub,
          email: decoded.email,
          user_metadata: decoded.user_metadata || {}
        }
      };
    }
  } catch (e) {
    console.error("Error parsing auth cookie:", e);
  }
  
  return null;
}

// Get authenticated user and profile
export async function getAuthProfile() {
  try {
    // Try to get session from cookie directly
    const session = await getSessionFromCookie();
    
    if (!session || !session.user) {
      console.error("No valid session found");
      return { user: null, profile: null, error: "Unauthorized" };
    }

    const user = session.user;
    console.log("User found from cookie:", user.email, "Role:", user.user_metadata?.role);

    // Get or create profile
    let profile = await db.profile.findUnique({
      where: { authId: user.id }
    });

    // If no profile exists, create one from user metadata
    if (!profile) {
      console.log("Creating profile for user:", user.email);
      try {
        profile = await db.profile.create({
          data: {
            authId: user.id,
            email: user.email!,
            firstName: user.user_metadata?.first_name || "",
            lastName: user.user_metadata?.last_name || "",
            role: (user.user_metadata?.role as "SELLER" | "ADMIN" | "WORKER") || "SELLER",
          }
        });
        console.log("Profile created:", profile.id, "VendorNumber:", profile.vendorNumber);
      } catch (e: any) {
        console.error("Profile creation error:", e.message);
        // Profile might have been created by another request
        profile = await db.profile.findUnique({
          where: { authId: user.id }
        });
      }
    }
    
    // Add formatted vendorId to user object for easy access
    if (profile) {
      (user as any).vendorId = `U-${String(profile.vendorNumber).padStart(5, "0")}`;
    }

    if (profile) {
      console.log("Profile found:", profile.id, "Role:", profile.role);
    }

    return { user, profile, error: null };
  } catch (e: any) {
    console.error("getAuthProfile error:", e.message);
    return { user: null, profile: null, error: "Unauthorized" };
  }
}

// Check if user is admin
export async function requireAdmin() {
  const { user, profile, error } = await getAuthProfile();
  
  if (error || !profile) {
    console.error("requireAdmin failed:", error || "No profile");
    return { profile: null, error: error || "Profile not found" };
  }

  // Check both profile role and user metadata role
  const isAdmin = profile.role === "ADMIN" || user?.user_metadata?.role === "ADMIN";
  
  if (!isAdmin) {
    console.error("User is not admin. Profile role:", profile.role, "Metadata role:", user?.user_metadata?.role);
    return { profile: null, error: "Admin access required" };
  }

  return { profile, error: null };
}

// JSON response helpers
export function jsonResponse(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
