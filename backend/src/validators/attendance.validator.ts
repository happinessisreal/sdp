import { z } from "zod/v4";

export const recordAttendanceSchema = z.object({
  class_id: z.number().int().positive(),
  date: z.string(), // ISO date string
  records: z.array(
    z.object({
      student_id: z.number().int().positive(),
      status: z.enum(["PRESENT", "ABSENT", "LATE"]),
    })
  ).min(1, "At least one attendance record is required"),
});

export const updateAttendanceSchema = z.object({
  status: z.enum(["PRESENT", "ABSENT", "LATE"]),
});

export type RecordAttendanceInput = z.infer<typeof recordAttendanceSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
