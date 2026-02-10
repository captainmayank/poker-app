import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSessionSchema } from "@/lib/validations";
import { ROLES, SESSION_STATUS } from "@/lib/constants";

// GET /api/sessions - List all sessions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const playerId = searchParams.get("playerId");

    const where: any = {};
    if (status) {
      where.status = status;
    }

    // If player (non-admin), only show sessions they're involved in
    if (session.user.role === ROLES.PLAYER && playerId) {
      where.buyIns = {
        some: {
          playerId: parseInt(playerId),
        },
      };
    }

    const sessions = await prisma.session.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
        buyIns: {
          include: {
            player: {
              select: {
                id: true,
                fullName: true,
                username: true,
              },
            },
          },
        },
        sessionResults: {
          include: {
            player: {
              select: {
                id: true,
                fullName: true,
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            buyIns: true,
          },
        },
      },
      orderBy: {
        sessionDate: "desc",
      },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/sessions - Create new session (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== ROLES.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = createSessionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { sessionName, sessionDate, startTime, notes } = validation.data;

    const newSession = await prisma.session.create({
      data: {
        sessionName,
        sessionDate: new Date(sessionDate),
        startTime: new Date(startTime),
        status: SESSION_STATUS.ACTIVE,
        notes,
        createdById: parseInt(session.user.id),
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
