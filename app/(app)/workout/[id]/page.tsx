"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Plus, Trash2, Check, ChevronDown, ChevronUp, Timer, X, ArrowLeftRight } from "lucide-react";
import { kgToLbs, lbsToKg } from "@/lib/utils";

interface Set {
  id: string;
  exerciseId: string;
  setNumber: number;
  reps: number;
  weight: number;
  rpe?: number | null;
}

interface ExerciseBlock {
  exerciseId: string;
  name: string;
  sets: Set[];
  collapsed: boolean;
}

interface LastSet {
  weight: number;
  reps: number;
}

export default function ActiveWorkoutPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [unit, setUnit] = useState<"lbs" | "kg">("lbs");
  const [workoutName, setWorkoutName] = useState("Workout");
  const [blocks, setBlocks] = useState<ExerciseBlock[]>([]);
  const [timer, setTimer] = useState(0);
  const [adding, setAdding] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; category: string; equipment: string }[]>([]);
  const [finishing, setFinishing] = useState(false);
  const [lastSets, setLastSets] = useState<Record<string, LastSet>>({});
  const [swappingId, setSwappingId] = useState<string | null>(null);
  const [swapQuery, setSwapQuery] = useState("");
  const [swapResults, setSwapResults] = useState<{ id: string; name: string; equipment: string }[]>([]);

  const startTime = useRef(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch("/api/user").then((r) => r.json()).then((u) => {
      if (u?.unitSystem) setUnit(u.unitSystem);
    });
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => setTimer(Math.floor((Date.now() - startTime.current) / 1000)), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    fetch(`/api/workouts/${id}`).then((r) => r.json()).then((w) => {
      if (w.name) setWorkoutName(w.name);
      if (w.sets?.length) {
        const blockMap: Record<string, ExerciseBlock> = {};
        for (const s of w.sets) {
          if (!blockMap[s.exerciseId]) {
            blockMap[s.exerciseId] = { exerciseId: s.exerciseId, name: s.exercise.name, sets: [], collapsed: false };
          }
          blockMap[s.exerciseId].sets.push({ id: s.id, exerciseId: s.exerciseId, setNumber: s.setNumber, reps: s.reps, weight: s.weight, rpe: s.rpe });
        }
        setBlocks(Object.values(blockMap));
      }
    });
  }, [id]);

  useEffect(() => {
    const exerciseIds = searchParams.get("exercises")?.split(",").filter(Boolean);
    if (!exerciseIds?.length) return;
    fetch(`/api/exercises?q=`)
      .then((r) => r.json())
      .then((all: { id: string; name: string }[]) => {
        const toAdd = all.filter((e) => exerciseIds.includes(e.id));
        setBlocks(toAdd.map((e) => ({ exerciseId: e.id, name: e.name, sets: [], collapsed: false })));
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!adding) return;
    const t = setTimeout(() => {
      fetch(`/api/exercises?q=${encodeURIComponent(exerciseSearch)}`)
        .then((r) => r.json())
        .then(setSearchResults);
    }, 200);
    return () => clearTimeout(t);
  }, [exerciseSearch, adding]);

  useEffect(() => {
    if (!swappingId) return;
    const t = setTimeout(() => {
      fetch(`/api/exercises?q=${encodeURIComponent(swapQuery)}`)
        .then((r) => r.json())
        .then(setSwapResults);
    }, 200);
    return () => clearTimeout(t);
  }, [swapQuery, swappingId]);

  async function fetchLastSets(exerciseId: string) {
    if (lastSets[exerciseId] !== undefined) return;
    const r = await fetch(`/api/workouts/${id}/sets?exerciseId=${exerciseId}`);
    const sets: { weight: number; reps: number }[] = await r.json();
    if (sets.length > 0) {
      setLastSets((prev) => ({ ...prev, [exerciseId]: { weight: sets[0].weight, reps: sets[0].reps } }));
    }
  }

  function addExercise(ex: { id: string; name: string }) {
    if (blocks.find((b) => b.exerciseId === ex.id)) { setAdding(false); return; }
    setBlocks((prev) => [...prev, { exerciseId: ex.id, name: ex.name, sets: [], collapsed: false }]);
    setAdding(false);
    fetchLastSets(ex.id);
  }

  async function swapExercise(currentId: string, replacement: { id: string; name: string }) {
    const block = blocks.find((b) => b.exerciseId === currentId);
    if (!block) return;
    if (block.sets.length > 0) {
      const ok = window.confirm(
        `Swap ${block.name} with ${replacement.name}? Your ${block.sets.length} logged set${block.sets.length !== 1 ? "s" : ""} will be removed.`
      );
      if (!ok) return;
      await Promise.all(
        block.sets.map((s) => fetch(`/api/workouts/${id}/sets?setId=${s.id}`, { method: "DELETE" }))
      );
    }
    setBlocks((prev) =>
      prev.map((b) =>
        b.exerciseId === currentId
          ? { ...b, exerciseId: replacement.id, name: replacement.name, sets: [] }
          : b
      )
    );
    setSwappingId(null);
    setSwapQuery("");
  }

  async function addSet(exerciseId: string) {
    const block = blocks.find((b) => b.exerciseId === exerciseId)!;
    const prev = block.sets[block.sets.length - 1];
    const last = lastSets[exerciseId];
    const defaultWeightKg = prev?.weight ?? last?.weight ?? 0;
    const defaultReps = prev?.reps ?? last?.reps ?? 8;
    const res = await fetch(`/api/workouts/${id}/sets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exerciseId, setNumber: block.sets.length + 1, reps: defaultReps, weight: defaultWeightKg }),
    });
    const newSet = await res.json();
    setBlocks((prev) =>
      prev.map((b) =>
        b.exerciseId === exerciseId
          ? { ...b, sets: [...b.sets, { id: newSet.id, exerciseId, setNumber: newSet.setNumber, reps: newSet.reps, weight: newSet.weight, rpe: newSet.rpe }] }
          : b
      )
    );
  }

  async function updateSet(setId: string, exerciseId: string, field: "reps" | "weight", rawValue: string) {
    const numValue = parseFloat(rawValue);
    if (isNaN(numValue)) return;
    const weightKg = field === "weight" ? (unit === "lbs" ? lbsToKg(numValue) : numValue) : undefined;
    setBlocks((prev) =>
      prev.map((b) =>
        b.exerciseId === exerciseId
          ? { ...b, sets: b.sets.map((s) => s.id === setId ? { ...s, [field]: field === "weight" ? (weightKg ?? s.weight) : numValue } : s) }
          : b
      )
    );
    const block = blocks.find((b) => b.exerciseId === exerciseId);
    const currentSet = block?.sets.find((s) => s.id === setId);
    if (!currentSet) return;
    await fetch(`/api/workouts/${id}/sets?setId=${setId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reps: field === "reps" ? numValue : currentSet.reps,
        weight: field === "weight" ? (weightKg ?? currentSet.weight) : currentSet.weight,
      }),
    });
  }

  async function deleteSet(setId: string, exerciseId: string) {
    await fetch(`/api/workouts/${id}/sets?setId=${setId}`, { method: "DELETE" });
    setBlocks((prev) =>
      prev.map((b) =>
        b.exerciseId === exerciseId ? { ...b, sets: b.sets.filter((s) => s.id !== setId) } : b
      )
    );
  }

  async function finishWorkout() {
    setFinishing(true);
    await fetch(`/api/workouts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ duration: timer }),
    });
    router.push("/calendar");
  }

  function formatTimer(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  function displayWeight(kg: number): string {
    if (unit === "lbs") return String(Math.round(kgToLbs(kg) * 4) / 4);
    return String(kg);
  }

  const totalSets = blocks.reduce((s, b) => s + b.sets.length, 0);
  const totalVolKg = blocks.reduce((s, b) => s + b.sets.reduce((ss, set) => ss + set.weight * set.reps, 0), 0);

  return (
    <div className="flex flex-col min-h-dvh pb-6">
      {/* Header */}
      <div
        className="sticky top-0 z-30 px-4 pt-10 pb-3 flex items-center gap-3"
        style={{ background: "rgba(13,13,16,0.95)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-lg truncate">{workoutName}</h1>
          <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted)" }}>
            <span className="flex items-center gap-1">
              <Timer size={12} />
              {formatTimer(timer)}
            </span>
            <span>{totalSets} sets</span>
            <span>
              {unit === "lbs"
                ? `${Math.round(totalVolKg * 2.2046).toLocaleString()} lbs`
                : `${Math.round(totalVolKg).toLocaleString()} kg`}{" "}
              vol
            </span>
          </div>
        </div>
        <button
          className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5"
          style={{ background: "var(--green)", color: "white" }}
          onClick={finishWorkout}
          disabled={finishing}
        >
          <Check size={16} />
          Finish
        </button>
      </div>

      {/* Exercise blocks */}
      <div className="flex flex-col gap-4 px-4 pt-4">
        {blocks.map((block) => (
          <div key={block.exerciseId} className="card">
            {/* Block header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex-1 min-w-0 truncate pr-2">{block.name}</h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    if (swappingId === block.exerciseId) { setSwappingId(null); setSwapQuery(""); }
                    else { setSwappingId(block.exerciseId); setSwapQuery(""); setAdding(false); }
                  }}
                  className="p-1.5 rounded-lg"
                  style={{ color: swappingId === block.exerciseId ? "var(--accent)" : "var(--muted)" }}
                  title="Swap exercise"
                >
                  <ArrowLeftRight size={15} />
                </button>
                <button
                  onClick={() =>
                    setBlocks((prev) =>
                      prev.map((b) =>
                        b.exerciseId === block.exerciseId ? { ...b, collapsed: !b.collapsed } : b
                      )
                    )
                  }
                  className="p-1.5 rounded-lg"
                  style={{ color: "var(--muted)" }}
                >
                  {block.collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </button>
              </div>
            </div>

            {/* Swap search panel */}
            {swappingId === block.exerciseId && (
              <div
                className="mb-3 p-3 rounded-xl flex flex-col gap-2"
                style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
              >
                <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>
                  Replace with…
                </p>
                <input
                  className="input text-sm py-2"
                  placeholder="Search exercises..."
                  value={swapQuery}
                  onChange={(e) => setSwapQuery(e.target.value)}
                  autoFocus
                />
                <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                  {swapResults.map((ex) => (
                    <button
                      key={ex.id}
                      className="text-left px-3 py-2.5 rounded-lg text-sm"
                      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                      onClick={() => swapExercise(block.exerciseId, ex)}
                    >
                      {ex.name}
                      <span className="text-xs ml-2 capitalize" style={{ color: "var(--muted)" }}>
                        {ex.equipment}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!block.collapsed && (
              <>
                {block.sets.length > 0 && (
                  <div
                    className="grid text-xs font-medium mb-2 px-1"
                    style={{ gridTemplateColumns: "28px 1fr 1fr 32px", color: "var(--muted)" }}
                  >
                    <span>#</span>
                    <span>{unit === "lbs" ? "lbs" : "kg"}</span>
                    <span>Reps</span>
                    <span />
                  </div>
                )}

                {block.sets.map((set, i) => (
                  <div
                    key={set.id}
                    className="grid items-center gap-2 mb-2"
                    style={{ gridTemplateColumns: "28px 1fr 1fr 32px" }}
                  >
                    <span
                      className="text-xs font-bold text-center w-6 h-6 rounded-md flex items-center justify-center"
                      style={{ background: "var(--surface2)", color: "var(--muted)" }}
                    >
                      {i + 1}
                    </span>
                    <input
                      className="input text-center text-sm py-2"
                      type="number"
                      inputMode="decimal"
                      defaultValue={displayWeight(set.weight)}
                      onBlur={(e) => updateSet(set.id, block.exerciseId, "weight", e.target.value)}
                      key={`w-${set.id}-${unit}`}
                    />
                    <input
                      className="input text-center text-sm py-2"
                      type="number"
                      inputMode="numeric"
                      defaultValue={set.reps}
                      onBlur={(e) => updateSet(set.id, block.exerciseId, "reps", e.target.value)}
                    />
                    <button
                      onClick={() => deleteSet(set.id, block.exerciseId)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg"
                      style={{ color: "var(--red)" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}

                <button
                  className="btn-secondary mt-1 py-2.5 text-sm"
                  onClick={() => addSet(block.exerciseId)}
                >
                  <Plus size={16} />
                  Add Set
                </button>
              </>
            )}
          </div>
        ))}

        {/* Add exercise */}
        {!adding ? (
          <button className="btn-secondary" onClick={() => { setAdding(true); setSwappingId(null); }}>
            <Plus size={18} />
            Add Exercise
          </button>
        ) : (
          <div className="card flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Add Exercise</span>
              <button onClick={() => setAdding(false)} style={{ color: "var(--muted)" }}>
                <X size={18} />
              </button>
            </div>
            <input
              className="input"
              placeholder="Search exercises..."
              value={exerciseSearch}
              onChange={(e) => setExerciseSearch(e.target.value)}
              autoFocus
            />
            <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto">
              {searchResults.map((ex) => (
                <button
                  key={ex.id}
                  className="text-left px-3 py-2.5 rounded-lg text-sm font-medium"
                  style={{
                    background: "var(--surface2)",
                    color: blocks.find((b) => b.exerciseId === ex.id) ? "var(--accent)" : "var(--foreground)",
                  }}
                  onClick={() => addExercise(ex)}
                >
                  {ex.name}
                  <span className="text-xs ml-2 capitalize" style={{ color: "var(--muted)" }}>
                    {ex.equipment}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
