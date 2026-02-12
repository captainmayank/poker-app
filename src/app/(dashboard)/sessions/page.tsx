import { auth } from "@/lib/auth";
import { SessionsClient } from "./sessions-client";

export default async function SessionsPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  return <SessionsClient isAdmin={isAdmin} />;
}
