"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  // Optional 0-1 coverage score per muscle id. When provided, the diagram
  // switches to a "trained vs. neglected" heatmap instead of primary/secondary.
  heatmap?: Record<string, number>;
  className?: string;
}

type View = "front" | "back";

// Each muscle group: { id, cx, cy, rx, ry, view, transform? }
const FRONT_MUSCLES = [
  // Chest
  { id: "chest_left",      cx: 78,  cy: 106, rx: 22,  ry: 17 },
  { id: "chest_right",     cx: 122, cy: 106, rx: 22,  ry: 17 },
  // Front delts
  { id: "front_delt_left",  cx: 49,  cy: 84,  rx: 16, ry: 13 },
  { id: "front_delt_right", cx: 151, cy: 84,  rx: 16, ry: 13 },
  // Side delts
  { id: "side_delt_left",   cx: 34,  cy: 92,  rx: 12, ry: 10 },
  { id: "side_delt_right",  cx: 166, cy: 92,  rx: 12, ry: 10 },
  // Biceps
  { id: "bicep_left",      cx: 34,  cy: 120, rx: 11,  ry: 20 },
  { id: "bicep_right",     cx: 166, cy: 120, rx: 11,  ry: 20 },
  // Forearms
  { id: "forearm_left",    cx: 35,  cy: 162, rx: 9,   ry: 19 },
  { id: "forearm_right",   cx: 165, cy: 162, rx: 9,   ry: 19 },
  // Abs (3 pairs)
  { id: "upper_abs",  cx: 100, cy: 148, rx: 20,  ry: 10 },
  { id: "lower_abs",  cx: 100, cy: 175, rx: 18,  ry: 12 },
  // Obliques
  { id: "oblique_left",    cx: 68,  cy: 162, rx: 13,  ry: 22 },
  { id: "oblique_right",   cx: 132, cy: 162, rx: 13,  ry: 22 },
  // Serratus
  { id: "serratus_left",   cx: 60,  cy: 128, rx: 9,   ry: 14 },
  { id: "serratus_right",  cx: 140, cy: 128, rx: 9,   ry: 14 },
  // Quads
  { id: "quad_left",       cx: 78,  cy: 295, rx: 20,  ry: 42 },
  { id: "quad_right",      cx: 122, cy: 295, rx: 20,  ry: 42 },
  // Calves (front)
  { id: "calf_left",       cx: 78,  cy: 378, rx: 13,  ry: 26 },
  { id: "calf_right",      cx: 122, cy: 378, rx: 13,  ry: 26 },
];

const BACK_MUSCLES = [
  // Upper traps
  { id: "upper_trap",      cx: 100, cy: 82,  rx: 28,  ry: 13 },
  // Lower traps
  { id: "lower_trap",      cx: 100, cy: 108, rx: 22,  ry: 12 },
  // Rear delts
  { id: "rear_delt_left",  cx: 47,  cy: 82,  rx: 16,  ry: 13 },
  { id: "rear_delt_right", cx: 153, cy: 82,  rx: 16,  ry: 13 },
  // Side delts (back)
  { id: "side_delt_left",  cx: 33,  cy: 90,  rx: 11,  ry: 10 },
  { id: "side_delt_right", cx: 167, cy: 90,  rx: 11,  ry: 10 },
  // Lats
  { id: "lat_left",        cx: 55,  cy: 130, rx: 17,  ry: 36 },
  { id: "lat_right",       cx: 145, cy: 130, rx: 17,  ry: 36 },
  // Rhomboids
  { id: "rhomboid",        cx: 100, cy: 112, rx: 20,  ry: 16 },
  // Lower back
  { id: "lower_back",      cx: 100, cy: 195, rx: 26,  ry: 15 },
  // Triceps
  { id: "tricep_left",     cx: 33,  cy: 120, rx: 11,  ry: 20 },
  { id: "tricep_right",    cx: 167, cy: 120, rx: 11,  ry: 20 },
  // Forearms (back)
  { id: "forearm_left",    cx: 35,  cy: 162, rx: 9,   ry: 19 },
  { id: "forearm_right",   cx: 165, cy: 162, rx: 9,   ry: 19 },
  // Glutes
  { id: "glute_left",      cx: 82,  cy: 252, rx: 22,  ry: 22 },
  { id: "glute_right",     cx: 118, cy: 252, rx: 22,  ry: 22 },
  // Hamstrings
  { id: "hamstring_left",  cx: 80,  cy: 305, rx: 19,  ry: 40 },
  { id: "hamstring_right", cx: 120, cy: 305, rx: 19,  ry: 40 },
  // Calves (back)
  { id: "calf_back_left",  cx: 78,  cy: 380, rx: 13,  ry: 26 },
  { id: "calf_back_right", cx: 122, cy: 380, rx: 13,  ry: 26 },
];

function BodySilhouette({ view }: { view: View }) {
  if (view === "front") {
    return (
      <g opacity="0.18" fill="var(--cyan)" stroke="var(--cyan)" strokeWidth="0.5">
        {/* Head */}
        <ellipse cx="100" cy="28" rx="20" ry="23" />
        {/* Neck */}
        <rect x="91" y="49" width="18" height="20" rx="5" />
        {/* Shoulders + torso */}
        <path d="M 62 68 Q 48 65 30 74 L 24 87 L 28 108 L 30 148 L 32 185 L 32 206 L 44 230 L 56 235 L 60 215 L 62 195 L 66 155 L 68 148 L 62 90 L 68 70 L 100 67 L 132 70 L 138 90 L 132 148 L 134 155 L 138 195 L 140 215 L 144 235 L 156 230 L 168 206 L 168 185 L 170 148 L 172 108 L 176 87 L 170 74 Q 152 65 138 68 L 132 70 L 100 67 L 68 70 Z" />
        {/* Pelvis */}
        <path d="M 66 213 L 134 213 L 140 252 L 60 252 Z" />
        {/* Left thigh */}
        <rect x="60" y="250" width="40" height="90" rx="16" />
        {/* Right thigh */}
        <rect x="100" y="250" width="40" height="90" rx="16" />
        {/* Left knee */}
        <ellipse cx="80" cy="342" rx="18" ry="10" />
        {/* Right knee */}
        <ellipse cx="120" cy="342" rx="18" ry="10" />
        {/* Left calf */}
        <rect x="65" y="348" width="30" height="70" rx="12" />
        {/* Right calf */}
        <rect x="105" y="348" width="30" height="70" rx="12" />
        {/* Left foot */}
        <ellipse cx="80" cy="425" rx="18" ry="8" />
        {/* Right foot */}
        <ellipse cx="120" cy="425" rx="18" ry="8" />
      </g>
    );
  }

  return (
    <g opacity="0.18" fill="var(--cyan)" stroke="var(--cyan)" strokeWidth="0.5">
      {/* Head */}
      <ellipse cx="100" cy="28" rx="20" ry="23" />
      {/* Neck */}
      <rect x="91" y="49" width="18" height="20" rx="5" />
      {/* Shoulders + torso back */}
      <path d="M 62 68 Q 48 65 30 74 L 24 87 L 28 108 L 30 148 L 32 185 L 32 206 L 44 230 L 56 235 L 60 215 L 62 195 L 66 155 L 68 148 L 62 90 L 68 70 L 100 67 L 132 70 L 138 90 L 132 148 L 134 155 L 138 195 L 140 215 L 144 235 L 156 230 L 168 206 L 168 185 L 170 148 L 172 108 L 176 87 L 170 74 Q 152 65 138 68 L 132 70 L 100 67 L 68 70 Z" />
      {/* Pelvis */}
      <path d="M 62 213 L 138 213 L 143 252 L 57 252 Z" />
      {/* Left thigh */}
      <rect x="58" y="250" width="42" height="88" rx="16" />
      {/* Right thigh */}
      <rect x="100" y="250" width="42" height="88" rx="16" />
      {/* Left knee */}
      <ellipse cx="79" cy="340" rx="18" ry="10" />
      {/* Right knee */}
      <ellipse cx="121" cy="340" rx="18" ry="10" />
      {/* Left calf */}
      <rect x="64" y="346" width="30" height="72" rx="12" />
      {/* Right calf */}
      <rect x="106" y="346" width="30" height="72" rx="12" />
      {/* Left foot */}
      <ellipse cx="79" cy="424" rx="18" ry="8" />
      {/* Right foot */}
      <ellipse cx="121" cy="424" rx="18" ry="8" />
    </g>
  );
}

export default function BodyDiagram({ primaryMuscles = [], secondaryMuscles = [], heatmap, className }: Props) {
  const [view, setView] = useState<View>("front");

  const muscles = view === "front" ? FRONT_MUSCLES : BACK_MUSCLES;

  function getMuscleColor(id: string): string {
    if (heatmap) return (heatmap[id] ?? 0) > 0 ? "var(--accent)" : "var(--red)";
    if (primaryMuscles.includes(id)) return "var(--red)";
    if (secondaryMuscles.includes(id)) return "#f97316"; // orange for secondary
    return "var(--cyan)";
  }

  function getMuscleOpacity(id: string): number {
    if (heatmap) {
      const coverage = heatmap[id] ?? 0;
      return coverage > 0 ? 0.25 + coverage * 0.65 : 0.5;
    }
    if (primaryMuscles.includes(id)) return 0.9;
    if (secondaryMuscles.includes(id)) return 0.65;
    return 0.12;
  }

  function getMuscleGlow(id: string): string {
    if (heatmap) {
      const coverage = heatmap[id] ?? 0;
      return coverage > 0 ? "drop-shadow(0 0 5px var(--accent))" : "drop-shadow(0 0 6px var(--red))";
    }
    if (primaryMuscles.includes(id)) return "drop-shadow(0 0 6px var(--red))";
    if (secondaryMuscles.includes(id)) return "drop-shadow(0 0 4px #f97316)";
    return "none";
  }

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* View toggle */}
      <div
        className="flex rounded-lg overflow-hidden text-sm font-medium"
        style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
      >
        {(["front", "back"] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="px-5 py-2 capitalize transition-colors"
            style={{
              background: view === v ? "var(--accent)" : "transparent",
              color: view === v ? "var(--background)" : "var(--muted)",
            }}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Hologram container */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: "radial-gradient(ellipse at center, rgba(0,212,255,0.04) 0%, rgba(13,13,16,0.95) 80%)",
          border: "1px solid rgba(0,212,255,0.15)",
          boxShadow: "0 0 40px rgba(0,212,255,0.05), inset 0 0 40px rgba(0,212,255,0.02)",
        }}
      >
        {/* Scan line effect */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,212,255,0.015) 3px, rgba(0,212,255,0.015) 4px)",
          }}
        />

        <svg viewBox="0 0 200 445" width="200" height="445" className="relative z-20">
          <BodySilhouette view={view} />

          {muscles.map(({ id, cx, cy, rx, ry }) => (
            <ellipse
              key={id}
              cx={cx}
              cy={cy}
              rx={rx}
              ry={ry}
              fill={getMuscleColor(id)}
              opacity={getMuscleOpacity(id)}
              style={{ filter: getMuscleGlow(id), transition: "fill 0.3s, opacity 0.3s" }}
            />
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex gap-5 text-xs" style={{ color: "var(--muted)" }}>
        {heatmap ? (
          <>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full inline-block" style={{ background: "var(--accent)" }} />
              Trained
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full inline-block" style={{ background: "var(--red)" }} />
              Neglected
            </span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full inline-block" style={{ background: "var(--red)" }} />
              Primary
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full inline-block" style={{ background: "#f97316" }} />
              Secondary
            </span>
          </>
        )}
      </div>
    </div>
  );
}
