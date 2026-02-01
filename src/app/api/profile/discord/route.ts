import { db } from "@/lib/db";
import { getAuthProfile, jsonResponse, errorResponse } from "@/lib/api-utils";

// DELETE /api/profile/discord - Unlink Discord from profile
export async function DELETE() {
  try {
    const { profile, error } = await getAuthProfile();
    
    if (error || !profile) {
      return errorResponse(error || "Not authenticated", 401);
    }

    // Clear Discord fields from profile
    await db.profile.update({
      where: { id: profile.id },
      data: {
        discordId: null,
        discordUsername: null,
        discordAvatar: null,
        isExclusiveMember: false,
        exclusiveMemberCheckedAt: null,
      },
    });

    return jsonResponse({ success: true, message: "Discord unlinked" });
  } catch (e: any) {
    console.error("DELETE /api/profile/discord error:", e);
    return errorResponse(e.message, 500);
  }
}

