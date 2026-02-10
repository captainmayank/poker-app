// User roles
export const ROLES = {
  PLAYER: "player",
  ADMIN: "admin",
} as const;

// Session statuses
export const SESSION_STATUS = {
  ACTIVE: "active",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

// Buy-in statuses
export const BUYIN_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

// Settlement types
export const SETTLEMENT_TYPE = {
  PAYMENT: "payment",
  RECEIPT: "receipt",
} as const;
