import { createClient } from "@/lib/supabase/server";
import { db } from "./db";
import { UserRole } from "@prisma/client";

// ============================================
// TYPES
// ============================================

export interface AuthUser {
  id: string;
  authId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

// ============================================
// SESSION HELPERS
// ============================================

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  // Get profile from database
  const profile = await db.profile.findUnique({
    where: { authId: user.id },
  });

  if (!profile) return null;

  return {
    id: profile.id,
    authId: profile.authId,
    email: profile.email,
    firstName: profile.firstName,
    lastName: profile.lastName,
    role: profile.role,
  };
}

export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === "ADMIN";
}

export function isWorker(user: AuthUser | null): boolean {
  return user?.role === "WORKER" || user?.role === "ADMIN";
}

// ============================================
// PROFILE MANAGEMENT
// ============================================

export async function createProfile(
  authId: string,
  email: string,
  firstName: string,
  lastName: string,
  role: UserRole = "SELLER"
) {
  return db.profile.create({
    data: {
      authId,
      email,
      firstName,
      lastName,
      role,
    },
  });
}

export async function getProfileByAuthId(authId: string) {
  return db.profile.findUnique({
    where: { authId },
  });
}
