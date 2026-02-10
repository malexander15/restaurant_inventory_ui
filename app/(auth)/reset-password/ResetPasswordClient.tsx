"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AppInput from "@/app/components/ui/AppInput";
import AppButton from "@/app/components/ui/AppButton";
import AppAlert from "@/app/components/ui/AppAlert";
import { apiFetch } from "@/app/lib/api";

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token.");
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiFetch("/password/reset", {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({
          token,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });

      setSuccess(true);

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <AppAlert
          open={true}
          severity="error"
          message="Invalid password reset link."
          onClose={() => setSuccess(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm border rounded p-6 space-y-4">
        <h1 className="text-2xl font-bold text-center">Reset Password</h1>

        {error && (
          <AppAlert
            open={true}
            severity="error"
            message={error}
            onClose={() => setError(null)}
          />
        )}

        {success ? (
          <AppAlert
            open={true}
            severity="success"
            message="Password reset successful. Redirecting to login…"
            onClose={() => setSuccess(false)}
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <AppInput
              label="New Password"
              type="password"
              value={password}
              onChange={setPassword}
              required
            />

            <AppInput
              label="Confirm Password"
              type="password"
              value={passwordConfirmation}
              onChange={setPasswordConfirmation}
              required
            />

            <AppButton type="submit" fullWidth disabled={loading}>
              {loading ? "Resetting…" : "Reset Password"}
            </AppButton>
          </form>
        )}
      </div>
    </div>
  );
}