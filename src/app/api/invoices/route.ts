import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAuthProfile, jsonResponse, errorResponse } from "@/lib/api-utils";

// GET /api/invoices - List user's invoices
export async function GET(request: NextRequest) {
  try {
    const { profile, error } = await getAuthProfile();
    if (error) return errorResponse(error, 401);

    const invoices = await db.invoice.findMany({
      where: { userId: profile!.id },
      orderBy: { createdAt: "desc" },
      include: {
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
    console.error("GET /api/invoices error:", e);
    return errorResponse(e.message, 500);
  }
}
