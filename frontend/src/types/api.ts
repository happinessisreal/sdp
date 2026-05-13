export type Role = "ADMIN" | "TEACHER" | "STUDENT";
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE";
export type PaymentStatus = "PAID" | "PENDING" | "OVERDUE";

export interface UserSummary {
  id: number;
  name: string;
  email: string;
  role?: Role;
  created_at?: string;
}

export interface AuthUser extends UserSummary {
  role: Role;
  created_at: string;
  student?: {
    id: number;
    enrollment_date: string;
  } | null;
  teacher?: {
    id: number;
  } | null;
}

export interface Student {
  id: number;
  user_id: number;
  enrollment_date: string;
  user: UserSummary;
  _count?: {
    enrollments?: number;
    attendances?: number;
    payments?: number;
  };
}

export interface Teacher {
  id: number;
  user_id: number;
  user: UserSummary;
  _count?: {
    classes?: number;
    payments?: number;
  };
}

export interface ClassItem {
  id: number;
  teacher_id: number;
  name: string;
  date?: string | null;
  start_time?: string | null;
  number_of_days_a_week?: number | null;
  teacher: {
    user: Pick<UserSummary, "name" | "email">;
  };
  _count?: {
    enrollments?: number;
    attendances?: number;
    payments?: number;
  };
}

export interface Enrollment {
  id: number;
  student_id: number;
  class_id: number;
  enrolled_at: string;
  student: Student;
  class?: Pick<ClassItem, "id" | "name">;
}

export interface AttendanceRecord {
  id: number;
  student_id: number;
  class_id: number;
  date: string;
  status: AttendanceStatus;
  student?: Student;
  class?: Pick<ClassItem, "id" | "name">;
}

export interface Payment {
  id: number;
  student_id: number;
  teacher_id: number;
  class_id: number;
  amount: number;
  status: PaymentStatus;
  due_date: string;
  payment_date?: string | null;
  student: Student;
  teacher?: Teacher;
  class: Pick<ClassItem, "id" | "name">;
}

export interface PaymentSummary {
  paid: { count: number; total: number };
  pending: { count: number; total: number };
  overdue: { count: number; total: number };
  recentPayments: Payment[];
}
