import { auth } from "@/lib/auth";
import { SessionDetailClient } from "./session-detail-client";

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";
  const userId = session?.user?.id;

  const resolvedParams = await params;

  return <SessionDetailClient sessionId={resolvedParams.id} isAdmin={isAdmin} userId={userId || ""} />;
}
