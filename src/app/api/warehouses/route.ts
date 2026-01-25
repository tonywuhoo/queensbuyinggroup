import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAuthProfile, requireAdmin, jsonResponse, errorResponse } from "@/lib/api-utils";

// GET /api/warehouses - List all warehouses
export async function GET(request: NextRequest) {
  try {
    const { profile, error } = await getAuthProfile();
    if (error) return errorResponse(error, 401);

    const warehouses = await db.warehouse.findMany({
      where: { isActive: true },
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
