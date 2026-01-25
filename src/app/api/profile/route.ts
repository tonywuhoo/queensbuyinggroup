import { getAuthProfile, jsonResponse, errorResponse } from "@/lib/api-utils";

// GET /api/profile - Get current user's profile
export async function GET() {
  try {
    const { user, profile, error } = await getAuthProfile();
    
    if (error || !profile) {
      return errorResponse(error || "Not authenticated", 401);
    }

    // Format vendor ID from database
    const vendorId = `U-${String(profile.vendorNumber).padStart(5, "0")}`;

    return jsonResponse({
      id: profile.id,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      role: profile.role,
      vendorId,
      vendorNumber: profile.vendorNumber,
      createdAt: profile.createdAt,
    });
  } catch (e: any) {
    console.error("GET /api/profile error:", e);
    return errorResponse(e.message, 500);
  }
}
