import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin, isWorker } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateCommitmentSchema } from "@/lib/validations";

interface Props {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const commitment = await db.commitment.findUnique({
      where: { id },
    });

    if (!commitment) {
      return NextResponse.json(
        { error: "Commitment not found" },
        { status: 404 }
      );
    }

    // Only owner or admin/worker can update
    const isOwner = commitment.userId === user.id;
    const canManage = isAdmin(user) || isWorker(user);

    if (!isOwner && !canManage) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = updateCommitmentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;

    // Sellers can only add tracking info and mark as shipped
    if (isOwner && !canManage) {
      const allowedUpdates: Record<string, unknown> = {};
      if (data.trackingNumber) allowedUpdates.trackingNumber = data.trackingNumber;
      if (data.trackingCarrier) allowedUpdates.trackingCarrier = data.trackingCarrier;
      if (data.status === "SHIPPED") {
        allowedUpdates.status = "SHIPPED";
        allowedUpdates.shippedAt = new Date();
      }

      const updated = await db.commitment.update({
        where: { id },
        data: allowedUpdates,
        include: { deal: true },
      });

      return NextResponse.json(updated);
    }

    // Admin/Worker can update everything
    const updateData: Record<string, unknown> = { ...data };
    
    if (data.status === "SHIPPED" && !commitment.shippedAt) {
      updateData.shippedAt = new Date();
    }
    if (data.status === "RECEIVED" && !commitment.receivedAt) {
      updateData.receivedAt = new Date();
    }
    if (data.status === "FULFILLED" && !commitment.fulfilledAt) {
      updateData.fulfilledAt = new Date();
    }

    const updated = await db.commitment.update({
      where: { id },
      data: updateData,
      include: { deal: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update commitment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const commitment = await db.commitment.findUnique({
      where: { id },
      include: { deal: true, user: true },
    });

    if (!commitment) {
      return NextResponse.json(
        { error: "Commitment not found" },
        { status: 404 }
      );
    }

    // Only owner or admin can view
    if (commitment.userId !== user.id && !isAdmin(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(commitment);
  } catch (error) {
    console.error("Get commitment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
