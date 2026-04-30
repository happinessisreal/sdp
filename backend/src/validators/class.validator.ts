import { z } from "zod/v4";

export const createClassSchema = z.object({
  name: z.string().min(2, "Class name must be at least 2 characters").max(100),
  date: z.string().optional(),           // ISO date string
  start_time: z.string().optional(),     // "HH:mm" format
  number_of_days_a_week: z.number().int().min(1).max(7).optional(),
});

export const updateClassSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  date: z.string().optional(),
  start_time: z.string().optional(),
  number_of_days_a_week: z.number().int().min(1).max(7).optional(),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
