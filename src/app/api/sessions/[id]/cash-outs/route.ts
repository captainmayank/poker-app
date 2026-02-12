import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/sessions/[id]/cash-outs - Get all cash-out requests for a session (admin only)
export async function GET(
  _request: NextRequest,
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

    const results = await prisma.sessionResult.findMany({
      where: {
        sessionId,
      },
      include: {
        player: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        approver: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    });

    // Add profitLoss to each result
    const resultsWithProfitLoss = results.map((result) => ({
      ...result,
      profitLoss: Number(result.finalAmount) - Number(result.totalBuyIn),
    }));

    return NextResponse.json(resultsWithProfitLoss);
  } catch (error) {
    console.error("Error fetching cash-out requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
