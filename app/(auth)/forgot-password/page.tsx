"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppInput from "@/app/components/ui/AppInput";
import AppButton from "@/app/components/ui/AppButton";
import AppAlert from "@/app/components/ui/AppAlert";
import { apiFetch } from "@/app/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(true);
    setShowSuccessAlert(true);
    setResetUrl(null);
    setLoading(true);

    try {
      const data = await apiFetch("/password/forgot", {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({ email }),
      });

      setSuccess(true);

      // DEV ONLY: backend may return reset_url
      if (data?.reset_url) {
        setResetUrl(data.reset_url);
      }
    } catch (err) {
      // We still show success messaging to avoid email enumeration
      console.error(err);
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm border rounded p-6 space-y-4">
        <h1 className="text-2xl font-bold text-center">
          Forgot Password
        </h1>

        {error && (
          <AppAlert
            open={true}
            severity="error"
            message={error}
            onClose={() => setError(null)}
          />
        )}

        {success ? (
          <div className="space-y-3">
            {showSuccessAlert && (
              <AppAlert
                open={true}
                severity="success"
                message="If an account with that email exists, a password reset link has been sent."
                onClose={() => setShowSuccessAlert(false)}
              />
            )}

            {resetUrl && (
              <div className="text-sm border rounded p-3 break-all">
                <p className="font-semibold mb-1">
                  Dev reset link:
                </p>
                <a
                  href={resetUrl}
                  className="text-blue-600 underline"
                >
                  {resetUrl}
                </a>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <AppInput
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@restaurant.com"
              required
            />

            <AppButton type="submit" fullWidth disabled={loading}>
              {loading ? "Sending reset link…" : "Send reset link"}
            </AppButton>
          </form>
        )}

       <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => router.push("/signup")}
            className="text-sm text-blue-600 hover:underline"
          >
            Don’t have an account? Create one
          </button>
        </div>
                <div className="text-center">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="text-sm text-blue-600 hover:underline"
          >
            Remebered you info? Sign-In.
          </button>
        </div>
      </div>
    </div>
  );
}
