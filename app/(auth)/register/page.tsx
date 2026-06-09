"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Dumbbell, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    bodyweight: "",
    gender: "male",
    unitSystem: "lbs",
  });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Registration failed.");
      setLoading(false);
      return;
    }

    // Auto sign-in after registration
    const signInRes = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (signInRes?.ok) {
      // Update profile data
      const bw = form.unitSystem === "lbs"
        ? parseFloat(form.bodyweight) / 2.2046
        : parseFloat(form.bodyweight);

      await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bodyweight: isNaN(bw) ? null : Math.round(bw * 100) / 100,
          gender: form.gender,
          unitSystem: form.unitSystem,
          name: form.name,
        }),
      });

      router.push("/dashboard");
    } else {
      setError("Account created but sign-in failed. Please log in.");
      router.push("/login");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-10">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--accent)", boxShadow: "0 0 24px var(--accent-glow)" }}
          >
            <Dumbbell size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">IronTrack</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Create your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--muted)" }}>
              Name
            </label>
            <input
              className="input"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--muted)" }}>
              Email
            </label>
            <input
              className="input"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@email.com"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--muted)" }}>
              Password
            </label>
            <div className="relative">
              <input
                className="input pr-10"
                type={showPass ? "text" : "password"}
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--muted)" }}
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--muted)" }}>
                Units
              </label>
              <select
                className="input"
                value={form.unitSystem}
                onChange={(e) => update("unitSystem", e.target.value)}
                style={{ background: "var(--surface2)" }}
              >
                <option value="lbs">lbs</option>
                <option value="kg">kg</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--muted)" }}>
                Gender
              </label>
              <select
                className="input"
                value={form.gender}
                onChange={(e) => update("gender", e.target.value)}
                style={{ background: "var(--surface2)" }}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--muted)" }}>
              Bodyweight ({form.unitSystem}) — optional
            </label>
            <input
              className="input"
              type="number"
              inputMode="decimal"
              value={form.bodyweight}
              onChange={(e) => update("bodyweight", e.target.value)}
              placeholder={form.unitSystem === "lbs" ? "185" : "84"}
            />
          </div>

          {error && (
            <p className="text-sm text-center" style={{ color: "var(--red)" }}>
              {error}
            </p>
          )}

          <button className="btn-primary mt-2" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "var(--muted)" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--accent)" }} className="font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
