import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, jsonResponse, errorResponse } from "@/lib/api-utils";

// GET /api/admin/commitments - List all commitments
export async function GET(request: NextRequest) {
  try {
    const { profile, error } = await requireAdmin();
    if (error) return errorResponse(error, 403);

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const warehouse = searchParams.get("warehouse");
    const userId = searchParams.get("userId");

    const where: any = {};
    if (status) {
      where.status = status;
    } else {
      // By default, exclude cancelled commitments
      where.status = { not: "CANCELLED" };
    }
    if (warehouse) where.warehouse = warehouse;
    if (userId) where.userId = userId;

    const commitments = await db.commitment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        deal: {
          select: {
            title: true,
            retailPrice: true,
            payout: true,
            isExclusive: true,
            exclusivePrice: true,
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            vendorNumber: true,
            isExclusiveMember: true,
            companyName: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
            bankName: true,
            bankRouting: true,
            bankAccount: true,
            accountingNotes: true,
          }
        },
        tracking: true,
        labelRequest: true,
        invoice: true,
      }
    });

    // Add commitment IDs
    const commitmentsWithIds = commitments.map(c => ({
      ...c,
      commitmentId: `C-${String(c.commitmentNumber).padStart(5, "0")}`,
    }));

    return jsonResponse(commitmentsWithIds);
  } catch (e: any) {
    console.error("GET /api/admin/commitments error:", e);
    return errorResponse(e.message, 500);
  }
}

// PUT /api/admin/commitments - Update commitment status (fulfill, etc.)
export async function PUT(request: NextRequest) {
  try {
    const { profile, error } = await requireAdmin();
    if (error) return errorResponse(error, 403);

    const body = await request.json();
    const { id, status, notes, invoiceUrl, invoiceAmount } = body;

    if (!id) {
      return errorResponse("Commitment ID required");
    }

    const commitment = await db.commitment.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!commitment) {
      return errorResponse("Commitment not found", 404);
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    // If fulfilling with invoice
    if (status === "FULFILLED" && invoiceUrl) {
      updateData.fulfilledAt = new Date();
      updateData.fulfilledById = profile!.id;

      // Create invoice record
      await db.invoice.create({
        data: {
          commitmentId: id,
          userId: commitment.userId,
          skynovaUrl: invoiceUrl,
          amount: invoiceAmount || commitment.quantity, // Default to quantity if not specified
        }
      });
    }

    const updated = await db.commitment.update({
      where: { id },
      data: updateData,
      include: {
        deal: { select: { title: true } },
        user: { select: { firstName: true, lastName: true, email: true } }
      }
    });

    return jsonResponse(updated);
  } catch (e: any) {
    console.error("PUT /api/admin/commitments error:", e);
    return errorResponse(e.message, 500);
  }
}
