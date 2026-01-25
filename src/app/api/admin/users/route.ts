import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, jsonResponse, errorResponse } from "@/lib/api-utils";

// GET /api/admin/users - List all users with stats
export async function GET(request: NextRequest) {
  try {
    const { profile, error } = await requireAdmin();
    if (error) return errorResponse(error, 403);

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const role = searchParams.get("role");

    const where: any = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { vendorNumber: isNaN(parseInt(search)) ? undefined : parseInt(search) },
      ].filter(Boolean);
    }

    const users = await db.profile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            commitments: true,
            trackings: true,
            labelRequests: true,
            invoicesReceived: true,
          }
        }
      }
    });

    // Format vendor IDs and add stats
    const usersWithStats = users.map((user) => ({
      ...user,
      vendorId: `U-${String(user.vendorNumber).padStart(5, "0")}`,
      stats: user._count,
      _count: undefined,
    }));

    return jsonResponse(usersWithStats);
  } catch (e: any) {
    console.error("GET /api/admin/users error:", e);
    return errorResponse(e.message, 500);
  }
}

// GET /api/admin/users/[id] - Get single user with full details
export async function POST(request: NextRequest) {
  // Using POST for "get user details" to avoid path param complexity
  try {
    const { profile, error } = await requireAdmin();
    if (error) return errorResponse(error, 403);

    const body = await request.json();
    const { userId, vendorNumber } = body;

    const where: any = {};
    if (userId) where.id = userId;
    if (vendorNumber) where.vendorNumber = vendorNumber;

    if (!userId && !vendorNumber) {
      return errorResponse("userId or vendorNumber required");
    }

    const user = await db.profile.findFirst({
      where,
      include: {
        commitments: {
          orderBy: { createdAt: "desc" },
          include: {
            deal: {
              select: { title: true, payout: true }
            },
            tracking: true,
            invoice: true,
          }
        },
        trackings: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        invoicesReceived: {
          orderBy: { createdAt: "desc" },
        }
      }
    });

    if (!user) {
      return errorResponse("User not found", 404);
    }

    // Calculate user stats
    const stats = {
      totalCommitments: user.commitments.length,
      fulfilled: user.commitments.filter((c) => c.status === "FULFILLED").length,
      pending: user.commitments.filter((c) => c.status === "PENDING").length,
      dropOffPending: user.commitments.filter((c) => c.status === "DROP_OFF_PENDING").length,
      inTransit: user.commitments.filter((c) => c.status === "IN_TRANSIT").length,
      totalEarnings: user.invoicesReceived.reduce((sum, inv) => sum + Number(inv.amount), 0),
    };

    return jsonResponse({
      ...user,
      vendorId: `U-${String(user.vendorNumber).padStart(5, "0")}`,
      stats,
    });
  } catch (e: any) {
    console.error("POST /api/admin/users error:", e);
    return errorResponse(e.message, 500);
  }
}

// PUT /api/admin/users - Update user role
export async function PUT(request: NextRequest) {
  try {
    const { profile, error } = await requireAdmin();
    if (error) return errorResponse(error, 403);

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return errorResponse("userId and role required");
    }

    if (!["SELLER", "ADMIN", "WORKER"].includes(role)) {
      return errorResponse("Invalid role");
    }

    const user = await db.profile.update({
      where: { id: userId },
      data: { role },
    });

    return jsonResponse(user);
  } catch (e: any) {
    console.error("PUT /api/admin/users error:", e);
    return errorResponse(e.message, 500);
  }
}
