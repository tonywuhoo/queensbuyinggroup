import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAuthProfile, jsonResponse, errorResponse } from "@/lib/api-utils";

// GET /api/tracking - List user's tracking submissions
export async function GET(request: NextRequest) {
  try {
    const { profile, error } = await getAuthProfile();
    if (error) return errorResponse(error, 401);

    const searchParams = request.nextUrl.searchParams;
    const warehouse = searchParams.get("warehouse");
    const carrier = searchParams.get("carrier");

    const where: any = { userId: profile!.id };

    // Filter by warehouse through commitment
    if (warehouse) {
      where.commitment = { warehouse };
    }
    if (carrier) {
      where.carrier = carrier;
    }

    const trackings = await db.tracking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        commitment: {
          include: {
            deal: {
              select: { title: true, payout: true }
            }
          }
        }
      }
    });

    return jsonResponse(trackings);
  } catch (e: any) {
    console.error("GET /api/tracking error:", e);
    return errorResponse(e.message, 500);
  }
}

// POST /api/tracking - Submit new tracking
export async function POST(request: NextRequest) {
  try {
    const { profile, error } = await getAuthProfile();
    if (error) return errorResponse(error, 401);

    const body = await request.json();
    const { commitmentId, trackingNumber, carrier } = body;

    if (!commitmentId || !trackingNumber || !carrier) {
      return errorResponse("Missing required fields: commitmentId, trackingNumber, carrier");
    }

    // Validate carrier
    if (!["FEDEX", "UPS", "USPS"].includes(carrier)) {
      return errorResponse("Invalid carrier. Must be FEDEX, UPS, or USPS");
    }

    // Check commitment belongs to user
    const commitment = await db.commitment.findFirst({
      where: { id: commitmentId, userId: profile!.id }
    });

    if (!commitment) {
      return errorResponse("Commitment not found", 404);
    }

    if (commitment.status !== "PENDING") {
      return errorResponse("Can only submit tracking for pending commitments");
    }

    // Create tracking and update commitment
    const tracking = await db.tracking.create({
      data: {
        commitmentId,
        trackingNumber,
        carrier,
        userId: profile!.id,
        lastStatus: "Label Created",
      }
    });

    // Update commitment status
    await db.commitment.update({
      where: { id: commitmentId },
      data: { 
        status: "IN_TRANSIT",
        shippedAt: new Date()
      }
    });

    return jsonResponse(tracking, 201);
  } catch (e: any) {
    console.error("POST /api/tracking error:", e);
    return errorResponse(e.message, 500);
  }
}

// DELETE /api/tracking/[id] - Remove tracking submission
export async function DELETE(request: NextRequest) {
  try {
    const { profile, error } = await getAuthProfile();
    if (error) return errorResponse(error, 401);

    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return errorResponse("Tracking ID required");
    }

    const tracking = await db.tracking.findFirst({
      where: { id, userId: profile!.id }
    });

    if (!tracking) {
      return errorResponse("Tracking not found", 404);
    }

    // Delete tracking and revert commitment status
    await db.tracking.delete({ where: { id } });
    await db.commitment.update({
      where: { id: tracking.commitmentId },
      data: {
        status: "PENDING",
        shippedAt: null
      }
    });

    return jsonResponse({ success: true });
  } catch (e: any) {
    console.error("DELETE /api/tracking error:", e);
    return errorResponse(e.message, 500);
  }
}
