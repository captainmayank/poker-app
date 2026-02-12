import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBuyInSchema } from "@/lib/validations";
import { ROLES } from "@/lib/constants";

// GET /api/buy-ins - List buy-ins (filtered by session or player)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const playerId = searchParams.get("playerId");
    const status = searchParams.get("status");

    const where: any = {};

    if (sessionId) {
      where.sessionId = parseInt(sessionId);
    }

    if (playerId) {
      where.playerId = parseInt(playerId);
    } else if (session.user.role !== ROLES.ADMIN) {
      // Non-admins can only see their own buy-ins
      where.playerId = parseInt(session.user.id);
    }

    if (status) {
      where.requestStatus = status.toUpperCase();
    }

    const buyIns = await prisma.buyIn.findMany({
      where,
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
            sessionDate: true,
          },
        },
        approver: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        requestedAt: "desc",
      },
    });

    return NextResponse.json(buyIns);
  } catch (error) {
    console.error("Error fetching buy-ins:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/buy-ins - Request a buy-in
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createBuyInSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { sessionId, amount } = validation.data;

    // Check if session exists and is active
    const sessionData = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!sessionData) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (sessionData.status !== "active") {
      return NextResponse.json(
        { error: "Can only request buy-ins for active sessions" },
        { status: 400 }
      );
    }

    // Create buy-in request
    const buyIn = await prisma.buyIn.create({
      data: {
        sessionId,
        playerId: parseInt(session.user.id),
        amount,
        requestStatus: "pending",
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
      },
    });

    return NextResponse.json(buyIn, { status: 201 });
  } catch (error) {
    console.error("Error creating buy-in:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
