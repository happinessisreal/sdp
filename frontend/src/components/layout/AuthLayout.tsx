import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import heroImage from "@/assets/hero.png";
import {
  BookOpenCheck,
  CalendarDays,
  CreditCard,
  GraduationCap,
  UsersRound,
} from "lucide-react";

export function AuthLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-surface-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-surface-50 text-surface-950">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-surface-950 text-white lg:flex">
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-surface-950/80" />
          <div className="relative z-10 flex h-full w-full flex-col justify-between p-10 xl:p-14">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-primary-700 shadow-lg shadow-black/20">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Tuition Track</h1>
                <p className="text-sm text-surface-300">Learning operations, simplified</p>
              </div>
            </div>

            <div className="max-w-xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm font-medium text-surface-100 backdrop-blur">
                <BookOpenCheck className="h-4 w-4 text-emerald-300" />
                Smart tuition center management
              </div>
              <h2 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
                Keep classes, students, and payments moving together.
              </h2>
              <p className="mt-5 max-w-lg text-base leading-7 text-surface-300">
                A focused workspace for admins, teachers, and students to handle daily academic work without the clutter.
              </p>
            </div>

            <div className="grid max-w-2xl grid-cols-3 gap-3">
              <div className="rounded-lg border border-white/10 bg-white/10 p-4 backdrop-blur">
                <UsersRound className="mb-3 h-5 w-5 text-cyan-300" />
                <p className="text-sm font-semibold">Student records</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/10 p-4 backdrop-blur">
                <CalendarDays className="mb-3 h-5 w-5 text-emerald-300" />
                <p className="text-sm font-semibold">Class schedules</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/10 p-4 backdrop-blur">
                <CreditCard className="mb-3 h-5 w-5 text-amber-300" />
                <p className="text-sm font-semibold">Payment tracking</p>
              </div>
            </div>
          </div>
        </section>

        <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
          <div className="w-full max-w-[450px] animate-slide-up">
            <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-600 text-white shadow-md">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-surface-950">Tuition Track</h1>
                <p className="text-sm text-surface-600">Learning operations, simplified</p>
              </div>
            </div>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
