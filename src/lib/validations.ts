import { z } from "zod";

// ============================================
// AUTH VALIDATIONS
// ============================================

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  phone: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

// ============================================
// DEAL VALIDATIONS
// ============================================

export const createDealSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required").max(5000),
  pricePerUnit: z.number().positive("Price must be positive"),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  dropoffAddress: z.string().max(500).optional(),
  maxQuantity: z.number().int().positive().optional().nullable(),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "CLOSED"]).default("DRAFT"),
  startsAt: z.date().optional(),
  endsAt: z.date().optional().nullable(),
});

export const updateDealSchema = createDealSchema.partial();

// ============================================
// COMMITMENT VALIDATIONS
// ============================================

export const createCommitmentSchema = z.object({
  dealId: z.string().min(1, "Deal ID is required"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
});

export const updateCommitmentSchema = z.object({
  trackingNumber: z.string().optional(),
  trackingCarrier: z.string().optional(),
  status: z.enum(["PENDING", "SHIPPED", "RECEIVED", "FULFILLED", "CANCELLED"]).optional(),
  adjustedQuantity: z.number().int().positive().optional(),
  notes: z.string().max(1000).optional(),
});

// ============================================
// LABEL REQUEST VALIDATIONS
// ============================================

export const createLabelRequestSchema = z.object({
  dealId: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const processLabelRequestSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "FULFILLED"]),
  labelUrl: z.string().url("Must be a valid URL").optional(),
  notes: z.string().max(500).optional(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
export type CreateCommitmentInput = z.infer<typeof createCommitmentSchema>;
export type UpdateCommitmentInput = z.infer<typeof updateCommitmentSchema>;
export type CreateLabelRequestInput = z.infer<typeof createLabelRequestSchema>;
export type ProcessLabelRequestInput = z.infer<typeof processLabelRequestSchema>;
