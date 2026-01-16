"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppInput from "@/app/components/ui/AppInput";
import AppButton from "@/app/components/ui/AppButton";
import AppAlert from "@/app/components/ui/AppAlert";
import { apiFetch } from '@/app/lib/api'

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiFetch("/login", {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({ email, password }),
      });

      // 🔐 Save token
      document.cookie = `token=${data.token}; path=/`;

      // 🚀 Redirect
      router.push("/products");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm border rounded p-6 space-y-4">
        <h1 className="text-2xl font-bold text-center">
          Restaurant Login
        </h1>

        {error && (
          <AppAlert
            open={true}
            severity="error"
            message={error}
            onClose={() => setError(null)}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <AppInput
            label="Email"
            type="email"
            value={email}
            onChange={(val) => setEmail(val)}
            placeholder="you@restaurant.com"
            required
          />

          <AppInput
            label="Password"
            type="password"
            value={password}
            onChange={(val) => setPassword(val)}
            placeholder="••••••••"
            required
          />
          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push("/forgot-password")}
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot your password?
            </button>
          </div>

          <AppButton
            type="submit"
            fullWidth
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign In"}
          </AppButton>
        </form>
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => router.push("/signup")}
            className="text-sm text-blue-600 hover:underline"
          >
            Don’t have an account? Create one
          </button>
        </div>
      </div>
    </div>
  );
}
