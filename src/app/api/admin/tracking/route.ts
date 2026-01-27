import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, jsonResponse, errorResponse } from "@/lib/api-utils";

// GET /api/admin/tracking - List all tracking submissions (admin only)
export async function GET(request: NextRequest) {
  try {
    const { profile, error } = await requireAdmin();
    if (error) return errorResponse(error, 403);

    const searchParams = request.nextUrl.searchParams;
    const warehouse = searchParams.get("warehouse");
    const carrier = searchParams.get("carrier");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = {};

    // Filter by warehouse through commitment
    if (warehouse && warehouse !== "ALL") {
      where.commitment = { ...where.commitment, warehouse };
    }

    // Filter by carrier
    if (carrier && carrier !== "ALL") {
      where.carrier = carrier;
    }

    // Filter by commitment status
    if (status && status !== "ALL") {
      where.commitment = { ...where.commitment, status };
    }

    // Search by tracking number, user email, or deal title
    if (search) {
      where.OR = [
        { trackingNumber: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { user: { firstName: { contains: search, mode: "insensitive" } } },
        { user: { lastName: { contains: search, mode: "insensitive" } } },
        { commitment: { deal: { title: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const trackings = await db.tracking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            vendorNumber: true,
          }
        },
        commitment: {
          include: {
            deal: {
              select: { 
                id: true,
                title: true, 
                payout: true,
                dealNumber: true,
              }
            }
          }
        }
      }
    });

    // Transform for frontend
    const transformed = trackings.map((t) => ({
      id: t.id,
      trackingNumber: t.trackingNumber,
      carrier: t.carrier,
      lastStatus: t.lastStatus,
      lastLocation: t.lastLocation,
      estimatedDelivery: t.estimatedDelivery,
      createdAt: t.createdAt,
      user: {
        id: t.user.id,
        name: `${t.user.firstName} ${t.user.lastName}`,
        email: t.user.email,
        vendorId: `U-${String(t.user.vendorNumber).padStart(5, "0")}`,
      },
      commitment: {
        id: t.commitment.id,
        quantity: t.commitment.quantity,
        warehouse: t.commitment.warehouse,
        status: t.commitment.status,
        deal: {
          id: t.commitment.deal.id,
          title: t.commitment.deal.title,
          dealId: `D-${String(t.commitment.deal.dealNumber).padStart(5, "0")}`,
          payout: t.commitment.deal.payout,
        }
      }
    }));

    return jsonResponse(transformed);
  } catch (e: any) {
    console.error("GET /api/admin/tracking error:", e);
    return errorResponse(e.message, 500);
  }
}

// PATCH /api/admin/tracking - Update tracking status
export async function PATCH(request: NextRequest) {
  try {
    const { profile, error } = await requireAdmin();
    if (error) return errorResponse(error, 403);

    const body = await request.json();
    const { trackingId, action, commitmentStatus, lastStatus, lastLocation } = body;

    if (!trackingId) {
      return errorResponse("Tracking ID required");
    }

    const tracking = await db.tracking.findUnique({
      where: { id: trackingId },
      include: { commitment: true }
    });

    if (!tracking) {
      return errorResponse("Tracking not found", 404);
    }

    // Update tracking info
    const trackingUpdate: any = {};
    if (lastStatus !== undefined) trackingUpdate.lastStatus = lastStatus;
    if (lastLocation !== undefined) trackingUpdate.lastLocation = lastLocation;

    if (Object.keys(trackingUpdate).length > 0) {
      await db.tracking.update({
        where: { id: trackingId },
        data: trackingUpdate
      });
    }

    // Update commitment status if provided
    if (commitmentStatus) {
      const commitmentUpdate: any = { status: commitmentStatus };
      
      if (commitmentStatus === "DELIVERED") {
        commitmentUpdate.deliveredAt = new Date();
      } else if (commitmentStatus === "FULFILLED") {
        commitmentUpdate.fulfilledAt = new Date();
      }

      await db.commitment.update({
        where: { id: tracking.commitmentId },
        data: commitmentUpdate
      });
    }

    return jsonResponse({ success: true });
  } catch (e: any) {
    console.error("PATCH /api/admin/tracking error:", e);
    return errorResponse(e.message, 500);
  }
}
