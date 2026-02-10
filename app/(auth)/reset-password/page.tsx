import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-sm border rounded p-6 space-y-4">
            <h1 className="text-2xl font-bold text-center">Reset Password</h1>
            <p className="text-center text-sm opacity-80">Loading…</p>
          </div>
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}