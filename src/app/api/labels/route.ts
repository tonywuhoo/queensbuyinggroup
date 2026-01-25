import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAuthProfile, jsonResponse, errorResponse } from "@/lib/api-utils";

// GET /api/labels - List user's label requests
export async function GET(request: NextRequest) {
  try {
    const { profile, error } = await getAuthProfile();
    if (error) return errorResponse(error, 401);

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    const where: any = { userId: profile!.id };
    if (status) where.status = status;

    const labels = await db.labelRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        commitment: {
          select: {
            id: true,
            quantity: true,
            warehouse: true,
            status: true,
            deal: {
              select: {
                title: true,
                freeLabelMin: true,
              }
            }
          }
        }
      }
    });

    return jsonResponse(labels);
  } catch (e: any) {
    console.error("GET /api/labels error:", e);
    return errorResponse(e.message, 500);
  }
}

// POST /api/labels - Request a label for a commitment
export async function POST(request: NextRequest) {
  try {
    const { profile, error } = await getAuthProfile();
    if (error) return errorResponse(error, 401);

    const body = await request.json();
    const { commitmentId } = body;

    if (!commitmentId) {
      return errorResponse("Missing required field: commitmentId");
    }

    // Check commitment belongs to user and is eligible
    const commitment = await db.commitment.findFirst({
      where: { id: commitmentId, userId: profile!.id },
      include: { deal: true, labelRequest: true }
    });

    if (!commitment) {
      return errorResponse("Commitment not found", 404);
    }

    if (commitment.labelRequest) {
      return errorResponse("Label already requested for this commitment");
    }

    if (commitment.status !== "PENDING") {
      return errorResponse("Can only request labels for pending commitments");
    }

    if (commitment.deliveryMethod !== "SHIP") {
      return errorResponse("Labels only available for shipping, not drop-off");
    }

    // Create label request
    const labelRequest = await db.labelRequest.create({
      data: {
        commitmentId,
        userId: profile!.id,
        dealId: commitment.dealId,
      },
      include: {
        commitment: {
          include: {
            deal: { select: { title: true } }
          }
        }
      }
    });

    return jsonResponse(labelRequest, 201);
  } catch (e: any) {
    console.error("POST /api/labels error:", e);
    return errorResponse(e.message, 500);
  }
}

// DELETE /api/labels - Cancel a label request
export async function DELETE(request: NextRequest) {
  try {
    const { profile, error } = await getAuthProfile();
    if (error) return errorResponse(error, 401);

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return errorResponse("Label request ID required");
    }

    const labelRequest = await db.labelRequest.findFirst({
      where: { id, userId: profile!.id }
    });

    if (!labelRequest) {
      return errorResponse("Label request not found", 404);
    }

    if (labelRequest.status !== "PENDING") {
      return errorResponse("Can only cancel pending requests");
    }

    await db.labelRequest.delete({ where: { id } });

    return jsonResponse({ success: true });
  } catch (e: any) {
    console.error("DELETE /api/labels error:", e);
    return errorResponse(e.message, 500);
  }
}
