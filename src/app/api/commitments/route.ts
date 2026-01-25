import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAuthProfile, jsonResponse, errorResponse } from "@/lib/api-utils";

// GET /api/commitments - List user's commitments
export async function GET(request: NextRequest) {
  try {
    const { profile, error } = await getAuthProfile();
    if (error) return errorResponse(error, 401);

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const warehouse = searchParams.get("warehouse");

    const where: any = { userId: profile!.id };
    if (status) {
      where.status = status;
    } else {
      // By default, exclude cancelled commitments
      where.status = { not: "CANCELLED" };
    }
    if (warehouse) where.warehouse = warehouse;

    const commitments = await db.commitment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        deal: {
          select: {
            id: true,
            dealNumber: true,
            title: true,
            retailPrice: true,
            payout: true,
            freeLabelMin: true,
          }
        },
        tracking: true,
        labelRequest: true,
        invoice: true,
      }
    });

    // Add IDs to each commitment
    const commitmentsWithIds = commitments.map(c => ({
      ...c,
      commitmentId: `C-${String(c.commitmentNumber).padStart(5, "0")}`,
      deal: {
        ...c.deal,
        dealId: `D-${String(c.deal.dealNumber).padStart(5, "0")}`,
      }
    }));

    return jsonResponse(commitmentsWithIds);
  } catch (e: any) {
    console.error("GET /api/commitments error:", e);
    return errorResponse(e.message, 500);
  }
}

// POST /api/commitments - Create new commitment (just quantity, delivery method later)
export async function POST(request: NextRequest) {
  try {
    const { profile, error } = await getAuthProfile();
    if (error) return errorResponse(error, 401);

    const body = await request.json();
    const { dealId, quantity } = body;

    if (!dealId || !quantity) {
      return errorResponse("Missing required fields: dealId, quantity");
    }

    // Check deal exists and is active
    const deal = await db.deal.findUnique({ where: { id: dealId } });
    if (!deal) return errorResponse("Deal not found", 404);
    if (deal.status !== "ACTIVE") return errorResponse("Deal is not active");

    // Check for existing commitments (fulfilled or active)
    const existingCommitments = await db.commitment.findMany({
      where: { dealId, userId: profile!.id, status: { not: "CANCELLED" } }
    });

    // Calculate quantities
    const fulfilledQty = existingCommitments
      .filter(c => c.status === "FULFILLED")
      .reduce((sum, c) => sum + c.quantity, 0);
    const activeCommitments = existingCommitments.filter(c => c.status !== "FULFILLED");
    const activeQty = activeCommitments.reduce((sum, c) => sum + c.quantity, 0);
    const totalCommitted = fulfilledQty + activeQty;

    // Check if user already has an active commitment in progress
    if (activeCommitments.length > 0) {
      return errorResponse("You already have an active commitment for this deal. Check My Commitments.");
    }

    // Check vendor limit
    const limit = deal.limitPerVendor || 999; // Default high limit if no limit set
    
    if (fulfilledQty >= limit) {
      return errorResponse(`You've already fulfilled the max quantity (${limit}) for this deal`);
    }
    
    const remainingAllowance = limit - totalCommitted;
    
    if (remainingAllowance <= 0) {
      return errorResponse(`You've reached the vendor limit of ${limit} for this deal`);
    }
    
    if (quantity > remainingAllowance) {
      return errorResponse(`You can only commit ${remainingAllowance} more units (limit: ${limit}/vendor, you've fulfilled: ${fulfilledQty})`);
    }

    // Create commitment with PENDING status - delivery method set later
    const commitment = await db.commitment.create({
      data: {
        dealId,
        userId: profile!.id,
        quantity,
        warehouse: "TBD", // Will be set when user chooses delivery method
        deliveryMethod: "SHIP", // Default, will be updated
        status: "PENDING",
      },
      select: {
        id: true,
        commitmentNumber: true,
        quantity: true,
        status: true,
        deliveryMethod: true,
        warehouse: true,
        createdAt: true,
        deal: {
          select: { title: true, dealNumber: true }
        }
      }
    });

    return jsonResponse({
      ...commitment,
      commitmentId: `C-${String(commitment.commitmentNumber).padStart(5, "0")}`,
      deal: {
        ...commitment.deal,
        dealId: `D-${String(commitment.deal.dealNumber).padStart(5, "0")}`,
      }
    }, 201);
  } catch (e: any) {
    console.error("POST /api/commitments error:", e);
    return errorResponse(e.message, 500);
  }
}

// PUT /api/commitments - Update commitment (set delivery method, warehouse, etc.)
export async function PUT(request: NextRequest) {
  try {
    const { profile, error } = await getAuthProfile();
    if (error) return errorResponse(error, 401);

    const body = await request.json();
    const { id, deliveryMethod, warehouse, quantity } = body;

    if (!id) {
      return errorResponse("Commitment ID required");
    }

    // Check commitment belongs to user
    const commitment = await db.commitment.findFirst({
      where: { id, userId: profile!.id }
    });

    if (!commitment) {
      return errorResponse("Commitment not found", 404);
    }

    // Only allow updates if pending
    if (!["PENDING", "DROP_OFF_PENDING"].includes(commitment.status)) {
      return errorResponse("Can only update pending commitments");
    }

    const updateData: any = {};
    if (deliveryMethod) {
      updateData.deliveryMethod = deliveryMethod;
      // Update status based on delivery method
      if (deliveryMethod === "DROP_OFF") {
        updateData.status = "DROP_OFF_PENDING";
      } else {
        updateData.status = "PENDING";
      }
    }
    if (warehouse) updateData.warehouse = warehouse;
    if (quantity) updateData.quantity = quantity;

    const updated = await db.commitment.update({
      where: { id },
      data: updateData,
      include: {
        deal: {
          select: { title: true, dealNumber: true, payout: true }
        }
      }
    });

    return jsonResponse({
      ...updated,
      deal: {
        ...updated.deal,
        dealId: `D-${String(updated.deal.dealNumber).padStart(5, "0")}`,
      }
    });
  } catch (e: any) {
    console.error("PUT /api/commitments error:", e);
    return errorResponse(e.message, 500);
  }
}

// DELETE /api/commitments - Cancel commitment
export async function DELETE(request: NextRequest) {
  try {
    const { profile, error } = await getAuthProfile();
    if (error) return errorResponse(error, 401);

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return errorResponse("Commitment ID required");
    }

    const commitment = await db.commitment.findFirst({
      where: { id, userId: profile!.id }
    });

    if (!commitment) {
      return errorResponse("Commitment not found", 404);
    }

    // Only allow cancellation if pending
    if (!["PENDING", "DROP_OFF_PENDING"].includes(commitment.status)) {
      return errorResponse("Can only cancel pending commitments");
    }

    await db.commitment.update({
      where: { id },
      data: { status: "CANCELLED" }
    });

    return jsonResponse({ success: true });
  } catch (e: any) {
    console.error("DELETE /api/commitments error:", e);
    return errorResponse(e.message, 500);
  }
}
