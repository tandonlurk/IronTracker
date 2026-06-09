"use client";

import { useState } from "react";
import { calculateDots, getDotsRank, getDotsPercentile } from "@/lib/dots";
import { lbsToKg } from "@/lib/utils";
import { Trophy } from "lucide-react";

const BIG_THREE = ["Squat", "Bench Press", "Deadlift"];

export default function RankPage() {
  const [unit, setUnit] = useState<"lbs" | "kg">("lbs");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [bodyweight, setBodyweight] = useState("");
  const [lifts, setLifts] = useState<Record<string, string>>({
    Squat: "",
    "Bench Press": "",
    Deadlift: "",
  });
  const [mode, setMode] = useState<"total" | "individual">("individual");

  function toKg(val: string): number {
    const n = parseFloat(val);
    if (isNaN(n) || n <= 0) return 0;
    return unit === "lbs" ? lbsToKg(n) : n;
  }

  const bwKg = toKg(bodyweight);
  const liftKgs = Object.values(lifts).map(toKg);
  const totalKg = liftKgs.reduce((s, v) => s + v, 0);

  const isValid = bwKg > 0;

  const totalDots = isValid && totalKg > 0 ? calculateDots(totalKg, bwKg, gender) : null;
  const individualDots = BIG_THREE.map((name, i) =>
    isValid && liftKgs[i] > 0 ? calculateDots(liftKgs[i], bwKg, gender) : null
  );

  const mainDots = mode === "total" ? totalDots : (individualDots.find((d) => d !== null) ?? null);
  const rank = mainDots ? getDotsRank(mainDots) : null;
  const percentile = mainDots ? getDotsPercentile(mainDots, gender) : null;

  return (
    <div className="flex flex-col gap-5 px-4 pt-10 pb-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Strength Ranking</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          DOTS score compares your lifts across bodyweights.
        </p>
      </div>

      {/* Settings row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--muted)" }}>
            Units
          </label>
          <div
            className="flex rounded-lg overflow-hidden"
            style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
          >
            {(["lbs", "kg"] as const).map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className="flex-1 py-2.5 text-sm font-medium"
                style={{
                  background: unit === u ? "var(--accent)" : "transparent",
                  color: unit === u ? "white" : "var(--muted)",
                }}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--muted)" }}>
            Gender
          </label>
          <div
            className="flex rounded-lg overflow-hidden"
            style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
          >
            {(["male", "female"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className="flex-1 py-2.5 text-sm font-medium capitalize"
                style={{
                  background: gender === g ? "var(--accent)" : "transparent",
                  color: gender === g ? "white" : "var(--muted)",
                }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bodyweight */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: "var(--muted)" }}>
          Bodyweight ({unit})
        </label>
        <input
          className="input"
          type="number"
          inputMode="decimal"
          placeholder={unit === "lbs" ? "185" : "84"}
          value={bodyweight}
          onChange={(e) => setBodyweight(e.target.value)}
        />
      </div>

      {/* Mode toggle */}
      <div
        className="flex rounded-lg overflow-hidden text-sm font-medium"
        style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
      >
        <button
          onClick={() => setMode("individual")}
          className="flex-1 py-2.5"
          style={{
            background: mode === "individual" ? "var(--accent)" : "transparent",
            color: mode === "individual" ? "white" : "var(--muted)",
          }}
        >
          Individual
        </button>
        <button
          onClick={() => setMode("total")}
          className="flex-1 py-2.5"
          style={{
            background: mode === "total" ? "var(--accent)" : "transparent",
            color: mode === "total" ? "white" : "var(--muted)",
          }}
        >
          Total (SBD)
        </button>
      </div>

      {/* Lift inputs */}
      {mode === "total" ? (
        <div
          className="card"
          style={{ borderColor: "rgba(99,102,241,0.2)" }}
        >
          <p className="font-semibold mb-3">SBD Total ({unit})</p>
          <div className="flex flex-col gap-3">
            {BIG_THREE.map((name, i) => (
              <div key={name} className="flex flex-col gap-1.5">
                <label className="text-sm" style={{ color: "var(--muted)" }}>
                  {name}
                </label>
                <input
                  className="input"
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={lifts[name]}
                  onChange={(e) => setLifts((prev) => ({ ...prev, [name]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {BIG_THREE.map((name, i) => (
            <div key={name} className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">{name}</span>
                {individualDots[i] !== null && (
                  <span
                    className="badge"
                    style={{
                      background: `${getDotsRank(individualDots[i]!).color}22`,
                      color: getDotsRank(individualDots[i]!).color,
                    }}
                  >
                    {getDotsRank(individualDots[i]!).label}
                  </span>
                )}
              </div>
              <input
                className="input"
                type="number"
                inputMode="decimal"
                placeholder={`Best ${name.toLowerCase()} (${unit})`}
                value={lifts[name]}
                onChange={(e) => setLifts((prev) => ({ ...prev, [name]: e.target.value }))}
              />
              {individualDots[i] !== null && (
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm" style={{ color: "var(--muted)" }}>
                    DOTS Score
                  </span>
                  <span className="text-xl font-bold" style={{ color: getDotsRank(individualDots[i]!).color }}>
                    {individualDots[i]!.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Result card */}
      {(mode === "total" ? totalDots : null) !== null && mode === "total" && totalDots && rank && (
        <div
          className="card text-center"
          style={{ borderColor: `${rank.color}44`, background: `${rank.color}0a` }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: `${rank.color}22` }}
          >
            <Trophy size={28} style={{ color: rank.color }} />
          </div>
          <p className="text-4xl font-bold mb-1" style={{ color: rank.color }}>
            {totalDots.toFixed(1)}
          </p>
          <p className="text-xl font-semibold mb-1" style={{ color: rank.color }}>
            {rank.label}
          </p>
          {percentile && (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Top {100 - percentile}% of lifters worldwide
            </p>
          )}
        </div>
      )}

      {/* Rank reference */}
      <div className="card">
        <h3 className="font-semibold mb-3">DOTS Rank Reference</h3>
        <div className="flex flex-col gap-2">
          {[
            { label: "Beginner", range: "< 120", color: "#6b7280" },
            { label: "Novice", range: "120–200", color: "#6b7280" },
            { label: "Intermediate", range: "200–300", color: "#22c55e" },
            { label: "Advanced", range: "300–400", color: "#3b82f6" },
            { label: "Master", range: "400–500", color: "#8b5cf6" },
            { label: "Elite", range: "500+", color: "#f59e0b" },
          ].map(({ label, range, color }) => (
            <div key={label} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: color }} />
                <span className="font-medium text-sm">{label}</span>
              </div>
              <span className="text-sm font-mono" style={{ color: "var(--muted)" }}>
                {range}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
