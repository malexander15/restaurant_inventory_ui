"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppInput from "@/app/components/ui/AppInput";
import AppButton from "@/app/components/ui/AppButton";
import AppAlert from "@/app/components/ui/AppAlert";
import { apiFetch } from '@/app/lib/api';
import Image from "next/image";
import { getErrorMessage } from "@/app/lib/errors";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  function handleLogoUpload(file: File) {
    const reader = new FileReader();

    reader.onloadend = () => {
      const result = reader.result as string;
      setLogoPreview(result);
      setLogoUrl(result); // base64 string for now
    };

    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiFetch("/signup", {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({
          name,
          email,
          password,
          password_confirmation: passwordConfirmation,
          logo_url: logoUrl,
        }),
      });

      // 🔐 Save token
      document.cookie = `token=${data.token}; path=/`;

      // 🚀 Redirect to app
      router.push("/products");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "An error occurred during signup. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm border rounded p-6 space-y-4">
        <h1 className="text-2xl font-bold text-center">
          Create Restaurant Account
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
            label="Restaurant Name"
            value={name}
            onChange={setName}
            placeholder="The Breakroom"
            required
          />

          <AppInput
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@restaurant.com"
            required
          />

          <AppInput
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            required
          />

          <AppInput
            label="Confirm Password"
            type="password"
            value={passwordConfirmation}
            onChange={setPasswordConfirmation}
            placeholder="••••••••"
            required
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Restaurant Logo (optional)
            </label>

            {logoPreview && (
              <div className="flex justify-center">
                <Image
                  src={logoPreview}
                  alt="Logo preview"
                  width={96}
                  height={96}
                  className="h-24 w-24 object-contain border rounded"
                />
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleLogoUpload(file);
              }}
            />
          </div>

          <AppButton type="submit" fullWidth disabled={loading}>
            {loading ? "Creating account…" : "Create Account"}
          </AppButton>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="text-sm text-blue-600 hover:underline"
          >
            Already have an account? Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
