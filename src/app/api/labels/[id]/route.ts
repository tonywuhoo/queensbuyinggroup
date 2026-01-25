import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { processLabelRequestSchema } from "@/lib/validations";

interface Props {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = processLabelRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { status, labelUrl, notes } = result.data;

    const labelRequest = await db.labelRequest.update({
      where: { id },
      data: {
        status,
        labelUrl: labelUrl || undefined,
        notes: notes || undefined,
        processedAt: new Date(),
        processedById: user.id,
      },
    });

    return NextResponse.json(labelRequest);
  } catch (error) {
    console.error("Process label request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
