"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { Check, LogOut } from "lucide-react";
import { lbsToKg, kgToLbs } from "@/lib/utils";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  bodyweight: number | null;
  gender: string | null;
  unitSystem: string;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState({ name: "", bodyweight: "", gender: "male", unitSystem: "lbs" });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/user")
      .then((r) => r.json())
      .then((u: UserProfile) => {
        setProfile(u);
        setForm({
          name: u.name ?? "",
          gender: u.gender ?? "male",
          unitSystem: u.unitSystem,
          bodyweight: u.bodyweight
            ? String(
                u.unitSystem === "lbs"
                  ? Math.round(kgToLbs(u.bodyweight) * 10) / 10
                  : u.bodyweight
              )
            : "",
        });
      });
  }, []);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function save() {
    setSaving(true);
    const bwKg =
      form.bodyweight
        ? form.unitSystem === "lbs"
          ? lbsToKg(parseFloat(form.bodyweight))
          : parseFloat(form.bodyweight)
        : null;

    await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name || null,
        bodyweight: bwKg && !isNaN(bwKg) ? Math.round(bwKg * 100) / 100 : null,
        gender: form.gender,
        unitSystem: form.unitSystem,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-dvh" style={{ color: "var(--muted)" }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-4 pt-10 pb-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Profile</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {profile.email}
        </p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
          style={{ background: "var(--accent)", boxShadow: "0 0 24px var(--accent-glow)" }}
        >
          {(form.name || profile.email)[0].toUpperCase()}
        </div>
        <div>
          <p className="font-semibold">{form.name || "No name set"}</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {profile.email}
          </p>
        </div>
      </div>

      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: "var(--muted)" }}>
          Name
        </label>
        <input
          className="input"
          type="text"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Your name"
        />
      </div>

      {/* Unit system */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: "var(--muted)" }}>
          Weight Units
        </label>
        <div
          className="flex rounded-lg overflow-hidden"
          style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
        >
          {(["lbs", "kg"] as const).map((u) => (
            <button
              key={u}
              onClick={() => update("unitSystem", u)}
              className="flex-1 py-3 text-sm font-medium"
              style={{
                background: form.unitSystem === u ? "var(--accent)" : "transparent",
                color: form.unitSystem === u ? "white" : "var(--muted)",
              }}
            >
              {u === "lbs" ? "Pounds (lbs)" : "Kilograms (kg)"}
            </button>
          ))}
        </div>
      </div>

      {/* Gender */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: "var(--muted)" }}>
          Gender (for DOTS ranking)
        </label>
        <div
          className="flex rounded-lg overflow-hidden"
          style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
        >
          {(["male", "female"] as const).map((g) => (
            <button
              key={g}
              onClick={() => update("gender", g)}
              className="flex-1 py-3 text-sm font-medium capitalize"
              style={{
                background: form.gender === g ? "var(--accent)" : "transparent",
                color: form.gender === g ? "white" : "var(--muted)",
              }}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Bodyweight */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: "var(--muted)" }}>
          Bodyweight ({form.unitSystem})
        </label>
        <input
          className="input"
          type="number"
          inputMode="decimal"
          value={form.bodyweight}
          onChange={(e) => update("bodyweight", e.target.value)}
          placeholder={form.unitSystem === "lbs" ? "185" : "84"}
        />
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          Used for DOTS strength ranking calculations.
        </p>
      </div>

      {/* Save */}
      <button
        className="btn-primary"
        onClick={save}
        disabled={saving}
        style={{
          background: saved ? "var(--green)" : "var(--accent)",
        }}
      >
        {saved ? (
          <>
            <Check size={18} />
            Saved!
          </>
        ) : saving ? (
          "Saving..."
        ) : (
          "Save Changes"
        )}
      </button>

      {/* Sign out */}
      <button
        className="btn-secondary mt-2"
        onClick={() => signOut({ callbackUrl: "/login" })}
        style={{ color: "var(--red)" }}
      >
        <LogOut size={16} />
        Sign Out
      </button>
    </div>
  );
}
