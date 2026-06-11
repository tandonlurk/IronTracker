"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Dumbbell } from "lucide-react";

interface TemplateExercise {
  name: string;
  sets: number;
  repRange: string;
}

interface Props {
  templateId?: string;
  initialName?: string;
  initialExercises?: TemplateExercise[];
}

export default function TemplateEditor({ templateId, initialName = "", initialExercises = [] }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [exercises, setExercises] = useState<TemplateExercise[]>(initialExercises);
  const [newName, setNewName] = useState("");
  const [newSets, setNewSets] = useState(3);
  const [newReps, setNewReps] = useState("8-12");
  const [saving, setSaving] = useState(false);

  function addExercise() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setExercises((prev) => [
      ...prev,
      { name: trimmed, sets: Math.max(1, newSets || 1), repRange: newReps.trim() || "8-12" },
    ]);
    setNewName("");
    setNewSets(3);
    setNewReps("8-12");
  }

  function removeExercise(idx: number) {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateExercise(idx: number, field: "name" | "sets" | "repRange", value: string) {
    setExercises((prev) =>
      prev.map((e, i) => {
        if (i !== idx) return e;
        if (field === "sets") return { ...e, sets: Math.max(1, parseInt(value) || 1) };
        return { ...e, [field]: value };
      })
    );
  }

  async function save() {
    if (!name.trim() || exercises.length === 0 || saving) return;
    setSaving(true);
    const url = templateId ? `/api/templates/${templateId}` : "/api/templates";
    await fetch(url, {
      method: templateId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        exercises: exercises.map((e) => ({
          name: e.name,
          sets: e.sets,
          repRange: e.repRange,
        })),
      }),
    });
    router.push("/templates");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        className="input text-base font-medium"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Template name (e.g. Push Day A)"
      />

      {exercises.length > 0 && (
        <div className="flex flex-col gap-2">
          {exercises.map((ex, idx) => (
            <div key={idx} className="card flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--surface2)", color: "var(--muted)" }}
                >
                  <Dumbbell size={15} />
                </div>
                <input
                  className="input text-sm font-medium flex-1"
                  value={ex.name}
                  onChange={(e) => updateExercise(idx, "name", e.target.value)}
                  placeholder="Exercise name"
                />
                <button
                  onClick={() => removeExercise(idx)}
                  className="p-2 rounded-lg flex-shrink-0"
                  style={{ color: "var(--red)" }}
                  title="Remove"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="flex items-center gap-4 pl-11">
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    Sets
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="input text-sm text-center py-1.5"
                    style={{ width: "56px" }}
                    value={ex.sets}
                    min={1}
                    max={20}
                    onChange={(e) => updateExercise(idx, "sets", e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    Reps
                  </span>
                  <input
                    type="text"
                    className="input text-sm text-center py-1.5"
                    style={{ width: "64px" }}
                    value={ex.repRange}
                    placeholder="8-12"
                    onChange={(e) => updateExercise(idx, "repRange", e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add exercise form */}
      <div className="card flex flex-col gap-3">
        <span className="font-medium text-sm">Add Exercise</span>
        <input
          className="input text-sm"
          placeholder="Exercise name (e.g. Romanian Deadlift)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addExercise();
          }}
        />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              Sets
            </span>
            <input
              type="number"
              inputMode="numeric"
              className="input text-sm text-center py-1.5"
              style={{ width: "56px" }}
              value={newSets}
              min={1}
              max={20}
              onChange={(e) => setNewSets(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              Reps
            </span>
            <input
              type="text"
              className="input text-sm text-center py-1.5"
              style={{ width: "64px" }}
              value={newReps}
              placeholder="8-12"
              onChange={(e) => setNewReps(e.target.value)}
            />
          </div>
          <button
            className="btn-secondary flex-1"
            onClick={addExercise}
            disabled={!newName.trim()}
            style={{ opacity: newName.trim() ? 1 : 0.45 }}
          >
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>

      <button
        className="btn-primary"
        onClick={save}
        disabled={saving || !name.trim() || exercises.length === 0}
        style={{ opacity: saving || !name.trim() || exercises.length === 0 ? 0.45 : 1 }}
      >
        {saving ? "Saving..." : templateId ? "Save Changes" : "Create Template"}
      </button>
    </div>
  );
}
