"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

type WorkoutSummary = { id: string; name: string; setCount: number };

export default function WorkoutCalendar({
  days,
}: {
  days: { date: string; workouts: WorkoutSummary[] }[];
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<string | null>(null);

  const dayMap = new Map(days.map((d) => [d.date, d.workouts]));

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDow = firstDay.getDay();

  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const pad = (n: number) => String(n).padStart(2, "0");
  const ds = (day: number) => `${year}-${pad(month + 1)}-${pad(day)}`;
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
    setSelected(null);
  };
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
    setSelected(null);
  };

  const monthLabel = firstDay.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const selectedWorkouts = selected ? (dayMap.get(selected) ?? []) : [];

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={prevMonth}
          className="w-9 h-9 flex items-center justify-center rounded-lg"
          style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="font-semibold">{monthLabel}</span>
        <button
          onClick={nextMonth}
          className="w-9 h-9 flex items-center justify-center rounded-lg"
          style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div
            key={d}
            className="text-center text-[11px] font-medium py-1"
            style={{ color: "var(--muted)" }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;
          const dateStr = ds(day);
          const hasWorkout = dayMap.has(dateStr);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selected;

          return (
            <button
              key={dateStr}
              onClick={() => setSelected(isSelected ? null : dateStr)}
              className="flex flex-col items-center gap-0.5 py-2 rounded-lg transition-colors"
              style={{
                background: isSelected
                  ? "var(--accent)"
                  : isToday
                  ? "var(--surface2)"
                  : "transparent",
                color: isSelected ? "var(--background)" : "var(--foreground)",
              }}
            >
              <span className="text-sm font-medium leading-none">{day}</span>
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: hasWorkout
                    ? isSelected
                      ? "var(--background)"
                      : "var(--accent)"
                    : "transparent",
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Selected day */}
      {selected && (
        <div className="mt-5 flex flex-col gap-2">
          <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>
            {new Date(selected + "T12:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          {selectedWorkouts.length === 0 ? (
            <p className="text-sm py-3" style={{ color: "var(--muted)" }}>
              Rest day
            </p>
          ) : (
            selectedWorkouts.map((w) => (
              <Link
                key={w.id}
                href={`/workout/${w.id}`}
                className="card flex items-center justify-between"
              >
                <span className="font-medium">{w.name}</span>
                <span className="text-sm" style={{ color: "var(--muted)" }}>
                  {w.setCount} sets
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
