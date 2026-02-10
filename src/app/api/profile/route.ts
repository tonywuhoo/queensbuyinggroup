import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAuthProfile, jsonResponse, errorResponse } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase/server";

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
      authId: profile.authId,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      role: profile.role,
      vendorId,
      vendorNumber: profile.vendorNumber,
      createdAt: profile.createdAt,
      // Business / Payment info
      companyName: profile.companyName,
      address: profile.address,
      city: profile.city,
      state: profile.state,
      zipCode: profile.zipCode,
      bankName: profile.bankName,
      bankRouting: profile.bankRouting,
      bankAccount: profile.bankAccount,
      accountingNotes: profile.accountingNotes,
      // Discord integration
      discordId: profile.discordId,
      discordUsername: profile.discordUsername,
      discordAvatar: profile.discordAvatar,
      isExclusiveMember: profile.isExclusiveMember,
      exclusiveMemberCheckedAt: profile.exclusiveMemberCheckedAt,
    });
  } catch (e: any) {
    console.error("GET /api/profile error:", e);
    return errorResponse(e.message, 500);
  }
}

// PATCH /api/profile - Update current user's profile
export async function PATCH(request: NextRequest) {
  try {
    const { profile, error } = await getAuthProfile();
    
    if (error || !profile) {
      return errorResponse(error || "Not authenticated", 401);
    }

    const body = await request.json();
    const { 
      firstName, lastName, phone,
      companyName, address, city, state, zipCode,
      bankName, bankRouting, bankAccount, accountingNotes 
    } = body;

    // Validate input
    if (!firstName || !lastName) {
      return errorResponse("First name and last name are required");
    }

    // Update profile in database
    const updatedProfile = await db.profile.update({
      where: { id: profile.id },
      data: {
        firstName,
        lastName,
        phone: phone || null,
        companyName: companyName || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        bankName: bankName || null,
        bankRouting: bankRouting || null,
        bankAccount: bankAccount || null,
        accountingNotes: accountingNotes || null,
      },
    });

    const vendorId = `U-${String(updatedProfile.vendorNumber).padStart(5, "0")}`;

    return jsonResponse({
      id: updatedProfile.id,
      email: updatedProfile.email,
      firstName: updatedProfile.firstName,
      lastName: updatedProfile.lastName,
      phone: updatedProfile.phone,
      role: updatedProfile.role,
      vendorId,
      vendorNumber: updatedProfile.vendorNumber,
      companyName: updatedProfile.companyName,
      address: updatedProfile.address,
      city: updatedProfile.city,
      state: updatedProfile.state,
      zipCode: updatedProfile.zipCode,
      bankName: updatedProfile.bankName,
      bankRouting: updatedProfile.bankRouting,
      bankAccount: updatedProfile.bankAccount,
      accountingNotes: updatedProfile.accountingNotes,
    });
  } catch (e: any) {
    console.error("PATCH /api/profile error:", e);
    return errorResponse(e.message, 500);
  }
}

// POST /api/profile/password - Change password (Supabase handles this)
export async function POST(request: NextRequest) {
  try {
    const { profile, error } = await getAuthProfile();
    
    if (error || !profile) {
      return errorResponse(error || "Not authenticated", 401);
    }

    const body = await request.json();
    const { newPassword } = body;

    if (!newPassword || newPassword.length < 8) {
      return errorResponse("Password must be at least 8 characters");
    }

    // Update password via Supabase
    const supabase = await createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error("Password update error:", updateError);
      return errorResponse(updateError.message, 400);
    }

    return jsonResponse({ success: true, message: "Password updated successfully" });
  } catch (e: any) {
    console.error("POST /api/profile error:", e);
    return errorResponse(e.message, 500);
  }
}
