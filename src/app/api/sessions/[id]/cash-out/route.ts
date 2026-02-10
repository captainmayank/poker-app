import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/sessions/[id]/cash-out - Submit final stack (cash out)
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await props.params;
    const sessionId = parseInt(params.id);

    const body = await request.json();
    const { finalAmount } = body;

    if (typeof finalAmount !== "number" || finalAmount < 0) {
      return NextResponse.json(
        { error: "Invalid final amount" },
        { status: 400 }
      );
    }

    // Check if session exists
    const sessionData = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!sessionData) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if player has any approved buy-ins in this session
    const buyIns = await prisma.buyIn.findMany({
      where: {
        sessionId,
        playerId: parseInt(session.user.id),
        requestStatus: "APPROVED",
      },
    });

    if (buyIns.length === 0) {
      return NextResponse.json(
        { error: "No approved buy-ins found for this session" },
        { status: 400 }
      );
    }

    // Update or create session result with final amount
    const result = await prisma.sessionResult.upsert({
      where: {
        sessionId_playerId: {
          sessionId,
          playerId: parseInt(session.user.id),
        },
      },
      create: {
        sessionId,
        playerId: parseInt(session.user.id),
        totalBuyIn: buyIns.reduce((sum, b) => sum + Number(b.amount), 0),
        finalAmount,
      },
      update: {
        finalAmount,
      },
    });

    // Calculate P/L
    const profitLoss = Number(result.finalAmount) - Number(result.totalBuyIn);

    return NextResponse.json({
      ...result,
      profitLoss,
    });
  } catch (error) {
    console.error("Error processing cash-out:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/sessions/[id]/cash-out - Get player's session result
export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await props.params;
    const sessionId = parseInt(params.id);

    const result = await prisma.sessionResult.findUnique({
      where: {
        sessionId_playerId: {
          sessionId,
          playerId: parseInt(session.user.id),
        },
      },
    });

    if (!result) {
      return NextResponse.json(
        { error: "No session result found" },
        { status: 404 }
      );
    }

    const profitLoss = Number(result.finalAmount) - Number(result.totalBuyIn);

    return NextResponse.json({
      ...result,
      profitLoss,
    });
  } catch (error) {
    console.error("Error fetching session result:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
