import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Users, Copy, LogOut, Plus, Hash } from "lucide-react";
import ClubCodeCopy from "@/components/ClubCodeCopy";

export default async function ClubPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const memberships = await prisma.clubMember.findMany({
    where: { userId },
    include: { club: true },
    orderBy: { joinedAt: "asc" },
  });

  // ── Server actions ────────────────────────────────────────────────

  async function createClub(formData: FormData) {
    "use server";
    const name = (formData.get("name") as string)?.trim();
    if (!name) return;

    const { auth: serverAuth } = await import("@/auth");
    const s = await serverAuth();
    if (!s?.user?.id) return;

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { prisma: db } = await import("@/lib/prisma");
    await db.club.create({
      data: {
        name,
        code,
        members: { create: { userId: s.user.id, role: "admin" } },
      },
    });

    redirect("/club");
  }

  async function joinClub(formData: FormData) {
    "use server";
    const code = (formData.get("code") as string)?.trim().toUpperCase();
    if (!code) return;

    const { auth: serverAuth } = await import("@/auth");
    const s = await serverAuth();
    if (!s?.user?.id) return;

    const { prisma: db } = await import("@/lib/prisma");
    const club = await db.club.findUnique({ where: { code } });
    if (!club) return;

    await db.clubMember.upsert({
      where: { clubId_userId: { clubId: club.id, userId: s.user.id } },
      create: { clubId: club.id, userId: s.user.id },
      update: {},
    });

    redirect("/club");
  }

  async function leaveClub(formData: FormData) {
    "use server";
    const clubId = formData.get("clubId") as string;
    if (!clubId) return;

    const { auth: serverAuth } = await import("@/auth");
    const s = await serverAuth();
    if (!s?.user?.id) return;

    const { prisma: db } = await import("@/lib/prisma");
    await db.clubMember.delete({
      where: { clubId_userId: { clubId, userId: s.user.id } },
    });

    // Delete club if no members remain
    const remaining = await db.clubMember.count({ where: { clubId } });
    if (remaining === 0) await db.club.delete({ where: { id: clubId } });

    redirect("/club");
  }

  // ── No club: create / join ────────────────────────────────────────

  if (memberships.length === 0) {
    return (
      <div className="flex flex-col gap-5 px-4 pt-10 pb-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Club</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Train together, compete together.
          </p>
        </div>

        <div
          className="card flex flex-col items-center text-center gap-3 py-10"
          style={{ color: "var(--muted)" }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--surface2)" }}
          >
            <Users size={24} style={{ color: "var(--foreground)" }} />
          </div>
          <div>
            <p className="font-semibold text-base" style={{ color: "var(--foreground)" }}>
              You&apos;re not in a club yet
            </p>
            <p className="text-sm mt-1">Create one for your crew or join with an invite code.</p>
          </div>
        </div>

        {/* Create */}
        <form action={createClub} className="card flex flex-col gap-3">
          <p className="font-semibold">Create a club</p>
          <input
            name="name"
            className="input"
            placeholder="Club name"
            maxLength={40}
            required
          />
          <button type="submit" className="btn-primary">
            <Plus size={16} />
            Create Club
          </button>
        </form>

        {/* Join */}
        <form action={joinClub} className="card flex flex-col gap-3">
          <p className="font-semibold">Join with a code</p>
          <input
            name="code"
            className="input"
            placeholder="6-character invite code"
            maxLength={6}
            style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}
            required
          />
          <button type="submit" className="btn-secondary">
            <Hash size={16} />
            Join Club
          </button>
        </form>
      </div>
    );
  }

  // ── Has club: view club ───────────────────────────────────────────

  const club = memberships[0].club;

  const members = await prisma.clubMember.findMany({
    where: { clubId: club.id },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { joinedAt: "asc" },
  });

  const memberIds = members.map((m) => m.userId);

  // Weekly leaderboard: workout count this week
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekWorkouts = await prisma.workout.findMany({
    where: { userId: { in: memberIds }, date: { gte: weekStart } },
    select: { userId: true },
  });

  const countByUser: Record<string, number> = {};
  for (const uid of memberIds) countByUser[uid] = 0;
  for (const w of weekWorkouts) countByUser[w.userId]++;

  const leaderboard = members
    .map((m) => ({
      id: m.userId,
      name: m.user.name ?? "Unknown",
      count: countByUser[m.userId] ?? 0,
      role: m.role,
      isYou: m.userId === userId,
    }))
    .sort((a, b) => b.count - a.count);

  // Recent activity: last 8 workouts from any member
  const recentWorkouts = await prisma.workout.findMany({
    where: { userId: { in: memberIds } },
    include: {
      user: { select: { name: true } },
      _count: { select: { sets: true } },
    },
    orderBy: { date: "desc" },
    take: 8,
  });

  const nameMap = new Map(members.map((m) => [m.userId, m.user.name ?? "Unknown"]));

  return (
    <div className="flex flex-col gap-5 px-4 pt-10 pb-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{club.name}</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {members.length} member{members.length !== 1 ? "s" : ""}
          </p>
        </div>
        <form action={leaveClub}>
          <input type="hidden" name="clubId" value={club.id} />
          <button
            type="submit"
            className="p-2 rounded-lg"
            style={{ color: "var(--muted)" }}
            title="Leave club"
          >
            <LogOut size={18} />
          </button>
        </form>
      </div>

      {/* Invite code */}
      <div
        className="card flex items-center justify-between gap-3"
      >
        <div>
          <p className="text-xs font-medium mb-0.5" style={{ color: "var(--muted)" }}>
            Invite code
          </p>
          <p className="text-xl font-bold tracking-widest">{club.code}</p>
        </div>
        <ClubCodeCopy code={club.code} />
      </div>

      {/* Weekly leaderboard */}
      <div>
        <h2 className="font-semibold text-base mb-3">This Week</h2>
        <div className="flex flex-col gap-2">
          {leaderboard.map((m, i) => (
            <div
              key={m.id}
              className="card flex items-center gap-3"
              style={m.isYou ? { borderColor: "var(--accent)" } : undefined}
            >
              <span
                className="text-sm font-bold w-5 text-center"
                style={{ color: i === 0 && m.count > 0 ? "var(--foreground)" : "var(--muted)" }}
              >
                {i + 1}
              </span>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: "var(--surface2)" }}
              >
                {(m.name[0] ?? "?").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {m.name}
                  {m.isYou && (
                    <span className="ml-1.5 text-xs" style={{ color: "var(--muted)" }}>
                      you
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">{m.count}</p>
                <p className="text-[10px]" style={{ color: "var(--muted)" }}>
                  {m.count === 1 ? "session" : "sessions"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      {recentWorkouts.length > 0 && (
        <div>
          <h2 className="font-semibold text-base mb-3">Activity</h2>
          <div className="flex flex-col gap-2">
            {recentWorkouts.map((w) => {
              const name = nameMap.get(w.userId) ?? "Unknown";
              const isYou = w.userId === userId;
              const daysAgo = Math.floor(
                (Date.now() - new Date(w.date).getTime()) / (1000 * 60 * 60 * 24)
              );
              const when =
                daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo}d ago`;

              return (
                <div key={w.id} className="card flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5"
                    style={{ background: "var(--surface2)" }}
                  >
                    {name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {isYou ? "You" : name}
                      <span style={{ color: "var(--muted)" }}> logged </span>
                      {w.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                      {w._count.sets} sets · {when}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Join another club */}
      <details className="card">
        <summary
          className="font-medium text-sm cursor-pointer"
          style={{ color: "var(--muted)" }}
        >
          Join another club
        </summary>
        <form action={joinClub} className="flex flex-col gap-3 mt-3">
          <input
            name="code"
            className="input"
            placeholder="6-character invite code"
            maxLength={6}
            style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}
            required
          />
          <button type="submit" className="btn-secondary">
            <Hash size={16} />
            Join
          </button>
        </form>
      </details>
    </div>
  );
}
