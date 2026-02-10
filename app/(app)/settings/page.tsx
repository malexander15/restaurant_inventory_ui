"use client";

import { useState } from "react";
import { useRef } from "react";
import AppInput from "@/app/components/ui/AppInput";
import AppButton from "@/app/components/ui/AppButton";
import AppAlert from "@/app/components/ui/AppAlert";
import { apiFetch } from "@/app/lib/api";
import { useRestaurant } from "@/app/lib/useRestaurant";

export default function SettingsPage() {
  const { restaurant, setRestaurant, loading } = useRestaurant();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (loading) return null;
  if (!restaurant) return null;

  async function handleSave() {
    const updated = await apiFetch("/me", {
      method: "PATCH",
      body: JSON.stringify({
        name: name || restaurant.name,
        email: email || restaurant.email,
        logo_url: logoUrl ?? restaurant.logo_url,
      }),
    });

    setRestaurant(updated);
    setSuccess(true);
  }

  function handleLogoUpload(file: File) {
    const reader = new FileReader();
    reader.onloadend = () => setLogoUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Account Settings</h1>

      {success && (
        <AppAlert
          open={true}
          severity="success"
          message="Settings updated successfully"
          onClose={() => setSuccess(false)}
        />
      )}

      <section className="space-y-4 border rounded p-4">
        <h2 className="font-semibold">Restaurant Info</h2>

        <AppInput
          label={restaurant.name}
          value={name}
          onChange={setName}
          placeholder="Change name to:"
        />

        <AppInput
          label={restaurant.email}
          value={email}
          onChange={setEmail}
          placeholder="Change email to:"
        />

        <div className="space-y-2">
          <label className="text-sm font-medium">Logo</label>

          {(logoUrl || restaurant.logo_url) && (
            <img
              src={logoUrl || restaurant.logo_url}
              alt="Restaurant logo preview"
              className="h-20 object-contain border rounded"
            />
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) =>
              e.target.files && handleLogoUpload(e.target.files[0])
            }
          />

          {/* Upload button */}
          <AppButton
            type="button"
            intent="ghost"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload Logo
          </AppButton>
        </div>

        <AppButton onClick={handleSave}>Save Changes</AppButton>
      </section>
    </div>
  );
}
