"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Search, X, Plus } from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  category: string;
  equipment: string | null;
  muscles: string[];
}

export default function StartWorkoutPage() {
  const router = useRouter();
  const [workoutName, setWorkoutName] = useState(`Workout — ${new Date().toLocaleDateString("en-US", { weekday: "long" })}`);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selected, setSelected] = useState<Exercise[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetch(`/api/exercises?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then(setExercises);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  function toggleExercise(ex: Exercise) {
    setSelected((prev) =>
      prev.find((e) => e.id === ex.id) ? prev.filter((e) => e.id !== ex.id) : [...prev, ex]
    );
  }

  async function startWorkout() {
    setCreating(true);
    const res = await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: workoutName }),
    });
    const workout = await res.json();
    router.push(`/workout/${workout.id}?exercises=${selected.map((e) => e.id).join(",")}`);
  }

  const EQUIPMENT_COLORS: Record<string, string> = {
    barbell: "#6366f1",
    dumbbell: "#22c55e",
    cable: "#00d4ff",
    machine: "#f59e0b",
    bodyweight: "#ec4899",
  };

  return (
    <div className="flex flex-col min-h-dvh px-4 pt-10 pb-6 gap-5">
      <div>
        <h1 className="text-2xl font-bold mb-1">New Workout</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Name it and pick your exercises.
        </p>
      </div>

      <input
        className="input text-base font-medium"
        value={workoutName}
        onChange={(e) => setWorkoutName(e.target.value)}
        placeholder="Workout name"
      />

      {/* Selected exercises chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((ex) => (
            <button
              key={ex.id}
              onClick={() => toggleExercise(ex)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{ background: "var(--accent)", color: "white" }}
            >
              {ex.name}
              <X size={14} />
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
        <input
          className="input pl-9"
          placeholder="Search exercises..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Exercise list */}
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
        {exercises.map((ex) => {
          const isSelected = selected.some((e) => e.id === ex.id);
          return (
            <button
              key={ex.id}
              onClick={() => toggleExercise(ex)}
              className="card flex items-center gap-3 text-left transition-all"
              style={{
                borderColor: isSelected ? "var(--accent)" : "var(--border)",
                background: isSelected ? "rgba(99,102,241,0.1)" : "var(--surface)",
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: `${EQUIPMENT_COLORS[ex.equipment ?? ""] ?? "#6b7280"}22`,
                  color: EQUIPMENT_COLORS[ex.equipment ?? ""] ?? "#6b7280",
                }}
              >
                <Dumbbell size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{ex.name}</p>
                <p className="text-xs capitalize" style={{ color: "var(--muted)" }}>
                  {ex.category} · {ex.equipment}
                </p>
              </div>
              {isSelected && (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--accent)" }}
                >
                  <Plus size={12} className="text-white" style={{ transform: "rotate(45deg)" }} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <button
        className="btn-primary"
        onClick={startWorkout}
        disabled={creating}
        style={{ opacity: creating ? 0.6 : 1 }}
      >
        <Plus size={20} />
        {creating ? "Starting..." : `Start Workout${selected.length > 0 ? ` (${selected.length} exercises)` : ""}`}
      </button>
    </div>
  );
}
