import { useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { AlertCircle, ArrowRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export function Login() {
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setError(null);
      const response = await api.post("/auth/login", data);
      
      if (response.data.success) {
        login(response.data.data.token, response.data.data.user);
        navigate("/dashboard");
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message || "Failed to login. Please check your credentials."
        );
      } else {
        setError("Failed to login. Please check your credentials.");
      }
    }
  };

  return (
    <Card className="overflow-hidden border-surface-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
      <CardHeader className="space-y-4 p-7 pb-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription className="text-base">
            Sign in to manage classes, attendance, and payments.
          </CardDescription>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-5 px-7 pb-2">
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-100 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
          
          <div className="space-y-2 pb-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-[22px] z-10 h-4 w-4 -translate-y-1/2 text-surface-500" />
              <Input
                id="email"
                type="email"
                placeholder="admin@tuitiontrack.com"
                autoComplete="email"
                className="h-11 bg-surface-50/80 pl-10 text-surface-950 placeholder:text-surface-400"
                {...register("email")}
                error={errors.email?.message}
              />
            </div>
          </div>
          
          <div className="space-y-2 pb-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-[22px] z-10 h-4 w-4 -translate-y-1/2 text-surface-500" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                className="h-11 bg-surface-50/80 pl-10 text-surface-950 placeholder:text-surface-400"
                {...register("password")}
                error={errors.password?.message}
              />
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-5 px-7 pb-7 pt-4">
          <Button type="submit" size="lg" className="w-full gap-2 px-4" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
            {!isSubmitting && <ArrowRight className="h-4 w-4" />}
          </Button>
          <div className="w-full rounded-md bg-surface-50 px-4 py-3 text-center text-sm text-surface-600">
            New to Tuition Track?{" "}
            <Link to="/register" className="font-semibold text-primary-700 hover:text-primary-800">
              Create an account
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
