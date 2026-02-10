import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAuthProfile, requireAdmin, jsonResponse, errorResponse } from "@/lib/api-utils";

// GET /api/warehouses - List warehouses
// ?all=true returns ALL warehouses including inactive (admin only, for historical filters)
export async function GET(request: NextRequest) {
  try {
    const { profile, error } = await getAuthProfile();
    if (error) return errorResponse(error, 401);

    const includeAll = request.nextUrl.searchParams.get("all") === "true";

    // Only admins can see inactive warehouses
    const where = (includeAll && profile!.role === "ADMIN") ? {} : { isActive: true };

    const warehouses = await db.warehouse.findMany({
      where,
      orderBy: { code: "asc" },
    });

    return jsonResponse(warehouses);
  } catch (e: any) {
    console.error("GET /api/warehouses error:", e);
    return errorResponse(e.message, 500);
  }
}

// POST /api/warehouses - Create warehouse (admin)
export async function POST(request: NextRequest) {
  try {
    const { profile, error } = await requireAdmin();
    if (error) return errorResponse(error, 403);

    const body = await request.json();
    const { code, name, address, city, state, zip, phone, allowDropOff, allowShipping } = body;

    if (!code || !name) {
      return errorResponse("code and name required");
    }

    const warehouse = await db.warehouse.create({
      data: { 
        code, 
        name, 
        address, 
        city, 
        state, 
        zip, 
        phone,
        allowDropOff: allowDropOff ?? true,
        allowShipping: allowShipping ?? true,
      },
    });

    return jsonResponse(warehouse, 201);
  } catch (e: any) {
    console.error("POST /api/warehouses error:", e);
    return errorResponse(e.message, 500);
  }
}

// PUT /api/warehouses - Update warehouse (admin)
export async function PUT(request: NextRequest) {
  try {
    const { profile, error } = await requireAdmin();
    if (error) return errorResponse(error, 403);

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return errorResponse("Warehouse ID required");
    }

    const warehouse = await db.warehouse.update({
      where: { id },
      data: updateData,
    });

    return jsonResponse(warehouse);
  } catch (e: any) {
    console.error("PUT /api/warehouses error:", e);
    return errorResponse(e.message, 500);
  }
}

// DELETE /api/warehouses - Delete warehouse (admin, only if no history)
export async function DELETE(request: NextRequest) {
  try {
    const { profile, error } = await requireAdmin();
    if (error) return errorResponse(error, 403);

    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return errorResponse("Warehouse ID required");
    }

    // Find the warehouse to get its code
    const warehouse = await db.warehouse.findUnique({ where: { id } });
    if (!warehouse) {
      return errorResponse("Warehouse not found", 404);
    }

    // Check if any commitments have ever used this warehouse code
    const commitmentCount = await db.commitment.count({
      where: { warehouse: warehouse.code }
    });

    if (commitmentCount > 0) {
      return errorResponse(
        `Cannot delete warehouse "${warehouse.code}" — it has ${commitmentCount} commitment${commitmentCount === 1 ? '' : 's'} in history. Deactivate it instead.`,
        409
      );
    }

    // Safe to delete — no history
    await db.warehouse.delete({ where: { id } });

    return jsonResponse({ success: true });
  } catch (e: any) {
    console.error("DELETE /api/warehouses error:", e);
    return errorResponse(e.message, 500);
  }
}
