"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { signup, isSigningUp } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({ resolver: zodResolver(signupSchema) });

  const onSubmit = (data: SignupFormData) => signup(data);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-card rounded-2xl p-8 w-full max-w-md shadow-glass"
      >
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🐜</div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Join task_management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Start your productive colony today
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Your name"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                {...register("name")}
              />
            </div>
            {errors.name && (
              <p className="text-danger text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-danger text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                placeholder="Min. 8 characters"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                {...register("password")}
              />
            </div>
            {errors.password && (
              <p className="text-danger text-xs mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSigningUp}
            className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
          >
            {isSigningUp ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-primary-600 hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
