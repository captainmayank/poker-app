import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/sessions/[id]/cash-out/approve - Approve player's cash-out
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const params = await props.params;
    const sessionId = parseInt(params.id);

    const body = await request.json();
    const { playerId, finalAmount } = body; // finalAmount is optional for editing

    if (!playerId) {
      return NextResponse.json(
        { error: "Player ID is required" },
        { status: 400 }
      );
    }

    // Check if session result exists
    const result = await prisma.sessionResult.findUnique({
      where: {
        sessionId_playerId: {
          sessionId,
          playerId: parseInt(playerId),
        },
      },
      include: {
        player: {
          select: {
            fullName: true,
            username: true,
          },
        },
      },
    });

    if (!result) {
      return NextResponse.json(
        { error: "Cash-out request not found" },
        { status: 404 }
      );
    }

    if (result.cashOutStatus.toLowerCase() !== "pending") {
      return NextResponse.json(
        { error: "Cash-out is not pending" },
        { status: 400 }
      );
    }

    // Approve cash-out (with optional amount adjustment)
    const updateData: any = {
      cashOutStatus: "approved",
      approvedById: parseInt(session.user.id),
      approvedAt: new Date(),
      rejectionNote: null,
    };

    // If finalAmount is provided, update it
    if (finalAmount !== undefined && finalAmount !== null) {
      updateData.finalAmount = finalAmount;
    }

    const updatedResult = await prisma.sessionResult.update({
      where: {
        sessionId_playerId: {
          sessionId,
          playerId: parseInt(playerId),
        },
      },
      data: updateData,
      include: {
        player: {
          select: {
            fullName: true,
            username: true,
          },
        },
        approver: {
          select: {
            fullName: true,
          },
        },
      },
    });

    const profitLoss = Number(updatedResult.finalAmount) - Number(updatedResult.totalBuyIn);

    return NextResponse.json({
      ...updatedResult,
      profitLoss,
    });
  } catch (error) {
    console.error("Error approving cash-out:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
