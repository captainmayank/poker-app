import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { hash } from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting seed...");

  // Create admin user
  const adminPassword = await hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      email: "admin@pokertracker.com",
      passwordHash: adminPassword,
      fullName: "Admin User",
      role: "admin",
      isActive: true,
    },
  });
  console.log("Created admin user:", admin.username);

  // Create test players
  const player1Password = await hash("player123", 10);
  const player1 = await prisma.user.upsert({
    where: { username: "player1" },
    update: {},
    create: {
      username: "player1",
      email: "player1@example.com",
      passwordHash: player1Password,
      fullName: "John Doe",
      role: "player",
      isActive: true,
    },
  });
  console.log("Created player 1:", player1.username);

  const player2Password = await hash("player123", 10);
  const player2 = await prisma.user.upsert({
    where: { username: "player2" },
    update: {},
    create: {
      username: "player2",
      email: "player2@example.com",
      passwordHash: player2Password,
      fullName: "Jane Smith",
      role: "player",
      isActive: true,
    },
  });
  console.log("Created player 2:", player2.username);

  const player3Password = await hash("player123", 10);
  const player3 = await prisma.user.upsert({
    where: { username: "player3" },
    update: {},
    create: {
      username: "player3",
      email: "player3@example.com",
      passwordHash: player3Password,
      fullName: "Bob Johnson",
      role: "player",
      isActive: true,
    },
  });
  console.log("Created player 3:", player3.username);

  console.log("\nSeed completed successfully!");
  console.log("\nTest credentials:");
  console.log("Admin - username: admin, password: admin123");
  console.log("Player 1 - username: player1, password: player123");
  console.log("Player 2 - username: player2, password: player123");
  console.log("Player 3 - username: player3, password: player123");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
