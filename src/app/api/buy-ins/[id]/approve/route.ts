import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/constants";

// PATCH /api/buy-ins/[id]/approve - Approve buy-in (admin only)
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== ROLES.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await props.params;
    const buyInId = parseInt(params.id);

    const body = await request.json();
    const { amount } = body; // Optional: admin can adjust amount

    // Check if buy-in exists and is pending
    const buyIn = await prisma.buyIn.findUnique({
      where: { id: buyInId },
      include: {
        session: true,
      },
    });

    if (!buyIn) {
      return NextResponse.json({ error: "Buy-in not found" }, { status: 404 });
    }

    if (buyIn.requestStatus !== "PENDING") {
      return NextResponse.json(
        { error: "Buy-in is not pending" },
        { status: 400 }
      );
    }

    // Update buy-in status
    const updatedBuyIn = await prisma.buyIn.update({
      where: { id: buyInId },
      data: {
        requestStatus: "APPROVED",
        approvedById: parseInt(session.user.id),
        approvedAt: new Date(),
        amount: amount ? amount : buyIn.amount, // Use adjusted amount if provided
      },
      include: {
        player: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        session: {
          select: {
            id: true,
            sessionName: true,
          },
        },
        approver: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    // Update session result to track total buy-ins
    await prisma.sessionResult.upsert({
      where: {
        sessionId_playerId: {
          sessionId: buyIn.sessionId,
          playerId: buyIn.playerId,
        },
      },
      create: {
        sessionId: buyIn.sessionId,
        playerId: buyIn.playerId,
        totalBuyIn: updatedBuyIn.amount,
        finalAmount: 0,
      },
      update: {
        totalBuyIn: {
          increment: updatedBuyIn.amount,
        },
      },
    });

    return NextResponse.json(updatedBuyIn);
  } catch (error) {
    console.error("Error approving buy-in:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
