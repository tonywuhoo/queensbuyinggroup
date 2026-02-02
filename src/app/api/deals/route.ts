import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAuthProfile, requireAdmin, jsonResponse, errorResponse } from "@/lib/api-utils";

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
        isExclusive: true,
        exclusivePrice: true,
        linkAmazon: true,
        linkBestBuy: true,
        linkWalmart: true,
        linkTarget: true,
        linkHomeDepot: true,
        linkLowes: true,
        linkOther: true,
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
