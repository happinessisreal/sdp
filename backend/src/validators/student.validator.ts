import { z } from "zod/v4";

export const createStudentSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.email(),
  password: z.string().min(6).max(128),
  enrollment_date: z.string().optional(), // ISO date string, defaults to now
});

export const updateStudentSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  enrollment_date: z.string().optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
