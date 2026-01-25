import { NextResponse } from "next/server";
import { getAuthProfile } from "@/lib/api-utils";

export async function GET() {
  const { user, profile, error } = await getAuthProfile();

  return NextResponse.json({
    success: !error,
    user: user ? { id: user.id, email: user.email, role: user.user_metadata?.role } : null,
    profile: profile ? { id: profile.id, email: profile.email, role: profile.role, vendorNumber: profile.vendorNumber } : null,
    error: error || null
  });
}
