import { z } from "zod";

// Auth schemas
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1).max(100),
  role: z.enum(["player", "admin"]),
});

// Session schemas
export const createSessionSchema = z.object({
  sessionName: z.string().min(1).max(100),
  sessionDate: z.string().min(1, "Session date is required"),
  startTime: z.string().min(1, "Start time is required"),
  notes: z.string().optional(),
});

export const endSessionSchema = z.object({
  sessionId: z.number(),
  results: z.array(
    z.object({
      playerId: z.number(),
      finalAmount: z.number().nonnegative(),
    })
  ),
});

// Buy-in schemas
export const createBuyInSchema = z.object({
  sessionId: z.number().positive(),
  amount: z.number().positive().max(100000, "Amount too large"),
});

export const approveBuyInSchema = z.object({
  amount: z.number().positive().optional(),
});

export const rejectBuyInSchema = z.object({
  rejectionReason: z.string().optional(),
});

// Settlement schemas
export const createSettlementSchema = z.object({
  playerId: z.number().positive(),
  settlementAmount: z.number().positive(),
  settlementType: z.enum(["payment", "receipt"]),
  settlementDate: z.coerce.date(),
  referenceNote: z.string().optional(),
});

// Export types
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type EndSessionInput = z.infer<typeof endSessionSchema>;
export type CreateBuyInInput = z.infer<typeof createBuyInSchema>;
export type ApproveBuyInInput = z.infer<typeof approveBuyInSchema>;
export type RejectBuyInInput = z.infer<typeof rejectBuyInSchema>;
export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;
