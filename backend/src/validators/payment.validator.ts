import { z } from "zod/v4";

export const createPaymentSchema = z.object({
  student_id: z.number().int().positive(),
  class_id: z.number().int().positive(),
  amount: z.number().positive("Amount must be positive"),
  due_date: z.string(), // ISO date string
  status: z.enum(["PAID", "PENDING", "OVERDUE"]).optional().default("PENDING"),
  payment_date: z.string().optional(), // ISO date string, set when paid
});

export const updatePaymentSchema = z.object({
  amount: z.number().positive().optional(),
  status: z.enum(["PAID", "PENDING", "OVERDUE"]).optional(),
  due_date: z.string().optional(),
  payment_date: z.string().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
