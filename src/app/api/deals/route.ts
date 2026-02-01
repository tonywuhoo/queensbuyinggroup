import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAuthProfile, requireAdmin, jsonResponse, errorResponse } from "@/lib/api-utils";
import { notifyDiscordWebhook, formatDealForDiscord } from "@/lib/discord-webhook";

// GET /api/deals - List deals (sellers only see ACTIVE, admins see all)
export async function GET(request: NextRequest) {
  try {
    const { profile, error } = await getAuthProfile();
    if (error) return errorResponse(error, 401);

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const includeExpired = searchParams.get("includeExpired") === "true";
    const isAdmin = profile?.role === "ADMIN";

    const where: any = {};
    
    // Sellers can NEVER see DRAFT deals
    if (!isAdmin) {
      // Only show ACTIVE (and optionally EXPIRED)
      if (includeExpired) {
        where.status = { in: ["ACTIVE", "EXPIRED"] };
      } else {
        where.status = "ACTIVE";
      }
    } else {
      // Admins can filter by status
      if (status) {
        where.status = status;
      }
    }

    const deals = await db.deal.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        dealNumber: true,
        title: true,
        description: true,
        imageUrl: true,
        retailPrice: true,
        payout: true,
        priceType: true,
        maxQuantity: true,
        limitPerVendor: true,
        freeLabelMin: true,
        status: true,
        deadline: true,
        createdAt: true,
        _count: {
          select: { commitments: true }
        }
      }
    });

    // Format dealId for display
    const dealsWithId = deals.map(deal => ({
      ...deal,
      dealId: `D-${String(deal.dealNumber).padStart(5, "0")}`,
    }));

    return jsonResponse(dealsWithId);
  } catch (e: any) {
    console.error("GET /api/deals error:", e);
    return errorResponse(e.message, 500);
  }
}

// POST /api/deals - Create new deal (admin only)
export async function POST(request: NextRequest) {
  try {
    const { profile, error } = await requireAdmin();
    if (error) {
      console.error("Auth error:", error);
      return errorResponse(error, 403);
    }

    if (!profile) {
      return errorResponse("Profile not found", 403);
    }

    const body = await request.json();
    console.log("Creating deal with data:", body);
    
    const { title, description, imageUrl, retailPrice, payout, limitPerVendor, freeLabelMin, deadline, status } = body;

    if (!title || retailPrice === undefined || payout === undefined) {
      return errorResponse("Missing required fields: title, retailPrice, payout");
    }

    // Determine price type
    const retailNum = Number(retailPrice);
    const payoutNum = Number(payout);
    let priceType: "ABOVE_RETAIL" | "RETAIL" | "BELOW_COST" = "BELOW_COST";
    if (payoutNum > retailNum) priceType = "ABOVE_RETAIL";
    else if (payoutNum === retailNum) priceType = "RETAIL";

    const deal = await db.deal.create({
      data: {
        title,
        description: description || "",
        imageUrl: imageUrl || null,
        retailPrice: retailNum,
        payout: payoutNum,
        priceType,
        limitPerVendor: limitPerVendor ? Number(limitPerVendor) : null,
        freeLabelMin: freeLabelMin ? Number(freeLabelMin) : null,
        deadline: deadline ? new Date(deadline) : null,
        status: status || "DRAFT",
        createdById: profile.id,
      }
    });

    console.log("Deal created:", deal.id, "DealNumber:", deal.dealNumber);

    const dealId = `D-${String(deal.dealNumber).padStart(5, "0")}`;

    // Notify Discord webhook if deal is ACTIVE
    if (deal.status === "ACTIVE") {
      try {
        const webhookPayload = formatDealForDiscord(deal, dealId);
        await notifyDiscordWebhook(webhookPayload);
      } catch (webhookError) {
        // Log but don't fail the request if webhook fails
        console.error("DISCORD_WEBHOOK | Failed to notify:", webhookError);
      }
    }

    return jsonResponse({
      ...deal,
      dealId,
    }, 201);
  } catch (e: any) {
    console.error("POST /api/deals error:", e);
    return errorResponse(e.message || "Failed to create deal", 500);
  }
}
