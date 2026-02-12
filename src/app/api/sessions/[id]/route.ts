import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/constants";

// GET /api/sessions/[id] - Get single session
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

    const sessionData = await prisma.session.findUnique({
      where: { id: sessionId },
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
            approver: {
              select: {
                id: true,
                fullName: true,
                username: true,
              },
            },
          },
          orderBy: {
            requestedAt: "desc",
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
      },
    });

    if (!sessionData) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(sessionData);
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/sessions/[id] - Update session status (admin only)
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
    const sessionId = parseInt(params.id);
    const body = await request.json();
    const { status } = body;

    if (!status || !["active", "completed", "cancelled"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be active, completed, or cancelled" },
        { status: 400 }
      );
    }

    const updateData: { status: string; endTime?: Date } = { status };

    // Set endTime when completing or cancelling a session
    if (status === "completed" || status === "cancelled") {
      updateData.endTime = new Date();
    }

    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: updateData,
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/sessions/[id] - Cancel session (admin only)
export async function DELETE(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== ROLES.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await props.params;
    const sessionId = parseInt(params.id);

    await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: "cancelled",
        endTime: new Date(),
      },
    });

    return NextResponse.json({ message: "Session cancelled" });
  } catch (error) {
    console.error("Error cancelling session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
