import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, jsonResponse, errorResponse } from "@/lib/api-utils";

// GET /api/admin/labels - List all label requests
export async function GET(request: NextRequest) {
  try {
    const { profile, error } = await requireAdmin();
    if (error) return errorResponse(error, 403);

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    const where: any = {};
    if (status) where.status = status;

    const labels = await db.labelRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            vendorNumber: true,
          }
        },
        deal: {
          select: {
            title: true,
            freeLabelMin: true,
          }
        },
        commitment: {
          select: {
            id: true,
            quantity: true,
            warehouse: true,
          }
        }
      }
    });

    return jsonResponse(labels);
  } catch (e: any) {
    console.error("GET /api/admin/labels error:", e);
    return errorResponse(e.message, 500);
  }
}

// PUT /api/admin/labels - Process label request
export async function PUT(request: NextRequest) {
  try {
    const { profile, error } = await requireAdmin();
    if (error) return errorResponse(error, 403);

    const body = await request.json();
    const { id, status, labelUrl, labelFiles, notes } = body;

    if (!id) {
      return errorResponse("Label request ID required");
    }

    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return errorResponse("Status must be APPROVED or REJECTED");
    }

    // For approval, require either labelFiles or labelUrl
    if (status === "APPROVED" && !labelFiles?.length && !labelUrl) {
      return errorResponse("At least one label file is required for approval");
    }

    const labelRequest = await db.labelRequest.update({
      where: { id },
      data: {
        status,
        labelUrl: status === "APPROVED" ? (labelUrl || null) : null,
        labelFiles: status === "APPROVED" && labelFiles?.length ? labelFiles : undefined,
        notes: notes || null,
        processedAt: new Date(),
        processedById: profile!.id,
      },
      include: {
        user: { select: { email: true, firstName: true } },
        deal: { select: { title: true } }
      }
    });

    // TODO: Send email notification to user

    return jsonResponse(labelRequest);
  } catch (e: any) {
    console.error("PUT /api/admin/labels error:", e);
    return errorResponse(e.message, 500);
  }
}
