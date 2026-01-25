import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, jsonResponse, errorResponse } from "@/lib/api-utils";

// GET /api/admin/invoices - List all invoices
export async function GET(request: NextRequest) {
  try {
    const { profile, error } = await requireAdmin();
    if (error) return errorResponse(error, 403);

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    const where: any = {};
    if (status) where.status = status;

    const invoices = await db.invoice.findMany({
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
        commitment: {
          include: {
            deal: {
              select: { title: true }
            }
          }
        }
      }
    });

    return jsonResponse(invoices);
  } catch (e: any) {
    console.error("GET /api/admin/invoices error:", e);
    return errorResponse(e.message, 500);
  }
}

// PUT /api/admin/invoices - Update invoice (mark paid, attach check)
export async function PUT(request: NextRequest) {
  try {
    const { profile, error } = await requireAdmin();
    if (error) return errorResponse(error, 403);

    const body = await request.json();
    const { id, status, checkNumber, checkImageUrl, notes } = body;

    if (!id) {
      return errorResponse("Invoice ID required");
    }

    const updateData: any = {};
    
    if (status) {
      updateData.status = status;
      if (status === "PAID") {
        updateData.paidAt = new Date();
      }
    }
    
    if (checkNumber !== undefined) updateData.checkNumber = checkNumber;
    if (checkImageUrl !== undefined) updateData.checkImageUrl = checkImageUrl;
    if (notes !== undefined) updateData.notes = notes;

    const invoice = await db.invoice.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true }
        },
        commitment: {
          include: {
            deal: { select: { title: true } }
          }
        }
      }
    });

    return jsonResponse(invoice);
  } catch (e: any) {
    console.error("PUT /api/admin/invoices error:", e);
    return errorResponse(e.message, 500);
  }
}
