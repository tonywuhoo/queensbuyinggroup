import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, jsonResponse, errorResponse } from "@/lib/api-utils";
import { notifyDiscordWebhook, formatDealForDiscord } from "@/lib/discord-webhook";

// GET /api/admin/deals - List all deals with stats
export async function GET(request: NextRequest) {
  try {
    const { profile, error } = await requireAdmin();
    if (error) return errorResponse(error, 403);

    const deals = await db.deal.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            commitments: true,
          }
        },
        commitments: {
          select: {
            status: true,
            quantity: true,
          }
        }
      }
    });

    // Calculate stats for each deal (excluding cancelled)
    const dealsWithStats = deals.map((deal) => {
      const activeCommitments = deal.commitments.filter((c) => c.status !== "CANCELLED");
      const totalCommitted = activeCommitments.reduce((sum, c) => sum + c.quantity, 0);
      const fulfilled = activeCommitments.filter((c) => c.status === "FULFILLED").length;
      
      return {
        ...deal,
        dealId: `D-${String(deal.dealNumber).padStart(5, "0")}`,
        stats: {
          totalCommitments: activeCommitments.length,
          totalQuantity: totalCommitted,
          fulfilled,
        },
        commitments: undefined, // Remove raw commitments from response
      };
    });

    return jsonResponse(dealsWithStats);
  } catch (e: any) {
    console.error("GET /api/admin/deals error:", e);
    return errorResponse(e.message, 500);
  }
}

// PUT /api/admin/deals/[id] - Update deal
export async function PUT(request: NextRequest) {
  try {
    const { profile, error } = await requireAdmin();
    if (error) return errorResponse(error, 403);

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return errorResponse("Deal ID required");
    }

    // Recalculate price type if prices changed
    if (updateData.retailPrice && updateData.payout) {
      if (updateData.payout > updateData.retailPrice) {
        updateData.priceType = "ABOVE_RETAIL";
      } else if (updateData.payout === updateData.retailPrice) {
        updateData.priceType = "RETAIL";
      } else {
        updateData.priceType = "BELOW_COST";
      }
    }

    if (updateData.deadline) {
      updateData.deadline = new Date(updateData.deadline);
    }

    // Get current deal state before update
    const currentDeal = await db.deal.findUnique({ where: { id } });
    if (!currentDeal) {
      return errorResponse("Deal not found", 404);
    }

    const deal = await db.deal.update({
      where: { id },
      data: updateData,
    });

    const dealId = `D-${String(deal.dealNumber).padStart(5, "0")}`;

    // Notify Discord if status changed to ACTIVE
    const statusChangedToActive = currentDeal.status !== "ACTIVE" && deal.status === "ACTIVE";
    if (statusChangedToActive) {
      try {
        const webhookPayload = formatDealForDiscord(deal, dealId);
        await notifyDiscordWebhook(webhookPayload);
        console.log("DISCORD_WEBHOOK | Notified for deal status change to ACTIVE:", dealId);
      } catch (webhookError) {
        console.error("DISCORD_WEBHOOK | Failed to notify:", webhookError);
      }
    }

    return jsonResponse({
      ...deal,
      dealId,
    });
  } catch (e: any) {
    console.error("PUT /api/admin/deals error:", e);
    return errorResponse(e.message, 500);
  }
}

// DELETE /api/admin/deals/[id] - Delete deal
export async function DELETE(request: NextRequest) {
  try {
    const { profile, error } = await requireAdmin();
    if (error) return errorResponse(error, 403);

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return errorResponse("Deal ID required");
    }

    // Check if deal has active (non-cancelled) commitments
    const deal = await db.deal.findUnique({
      where: { id },
      include: { 
        _count: { 
          select: { 
            commitments: {
              where: { status: { not: "CANCELLED" } }
            } 
          } 
        } 
      }
    });

    if (!deal) {
      return errorResponse("Deal not found", 404);
    }

    if (deal._count.commitments > 0) {
      return errorResponse("Cannot delete deal with active commitments. Set status to CLOSED instead.");
    }

    await db.deal.delete({ where: { id } });

    return jsonResponse({ success: true });
  } catch (e: any) {
    console.error("DELETE /api/admin/deals error:", e);
    return errorResponse(e.message, 500);
  }
}
