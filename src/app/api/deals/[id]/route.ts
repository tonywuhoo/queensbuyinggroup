import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAuthProfile, jsonResponse, errorResponse } from "@/lib/api-utils";

// GET /api/deals/[id] - Get single deal
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { profile, error } = await getAuthProfile();
    if (error) return errorResponse(error, 401);

    const deal = await db.deal.findUnique({
      where: { id: params.id },
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
        isExclusive: true,
        exclusivePrice: true,
        linkAmazon: true,
        linkBestBuy: true,
        linkWalmart: true,
        linkHomeDepot: true,
        linkLowes: true,
        linkOther: true,
        linkOtherName: true,
      }
    });

    if (!deal) {
      return errorResponse("Deal not found", 404);
    }

    // Sellers can only see ACTIVE deals
    const isAdmin = profile?.role === "ADMIN";
    if (!isAdmin && deal.status !== "ACTIVE") {
      return errorResponse("Deal not available", 404);
    }

    return jsonResponse({
      ...deal,
      dealId: `D-${String(deal.dealNumber).padStart(5, "0")}`,
    });
  } catch (e: any) {
    console.error("GET /api/deals/[id] error:", e);
    return errorResponse(e.message, 500);
  }
}
