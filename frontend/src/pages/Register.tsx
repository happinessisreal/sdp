import { useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import {
  AlertCircle,
  ArrowRight,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters").max(128),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    role: z.enum(["ADMIN", "TEACHER", "STUDENT"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export function Register() {
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "STUDENT",
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError(null);
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      };
      const response = await api.post("/auth/register", payload);

      if (response.data.success) {
        login(response.data.data.token, response.data.data.user);
        navigate("/dashboard");
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message || "Failed to create your account. Please try again."
        );
      } else {
        setError("Failed to create your account. Please try again.");
      }
    }
  };

  return (
    <Card className="overflow-hidden border-surface-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
      <CardHeader className="space-y-4 p-7 pb-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription className="text-base">
            Join as an admin, teacher, or student.
          </CardDescription>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4 px-7 pb-2">
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-100 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2 pb-2">
            <Label htmlFor="name">Full name</Label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-[22px] z-10 h-4 w-4 -translate-y-1/2 text-surface-500" />
              <Input
                id="name"
                type="text"
                placeholder="Your full name"
                className="h-11 pl-10"
                {...register("name")}
                error={errors.name?.message}
              />
            </div>
          </div>

          <div className="space-y-2 pb-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-[22px] z-10 h-4 w-4 -translate-y-1/2 text-surface-500" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="h-11 pl-10"
                {...register("email")}
                error={errors.email?.message}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 pb-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-[22px] z-10 h-4 w-4 -translate-y-1/2 text-surface-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  className="h-11 pl-10"
                  {...register("password")}
                  error={errors.password?.message}
                />
              </div>
            </div>

            <div className="space-y-2 pb-2">
              <Label htmlFor="confirmPassword">Confirm</Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-[22px] z-10 h-4 w-4 -translate-y-1/2 text-surface-500" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat password"
                  className="h-11 pl-10"
                  {...register("confirmPassword")}
                  error={errors.confirmPassword?.message}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 pb-2">
            <Label htmlFor="role">Account type</Label>
            <Select id="role" className="h-11" {...register("role")} error={errors.role?.message}>
              <option value="STUDENT">Student</option>
              <option value="TEACHER">Teacher</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-5 px-7 pb-7 pt-4">
          <Button type="submit" size="lg" className="w-full gap-2 px-4" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create account"}
            {!isSubmitting && <ArrowRight className="h-4 w-4" />}
          </Button>
          <div className="w-full rounded-md bg-surface-50 px-4 py-3 text-center text-sm text-surface-600">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary-700 hover:text-primary-800">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
