import { auth } from "@/lib/auth";
import { PlayersClient } from "./players-client";

export default async function PlayersPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  return <PlayersClient isAdmin={isAdmin} />;
}
