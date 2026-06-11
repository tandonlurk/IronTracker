"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, CalendarDays, Dumbbell, Users2, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard", icon: Dumbbell, label: "Train" },
  { href: "/calendar", icon: CalendarDays, label: "Calendar" },
  { href: "/progress", icon: BarChart2, label: "Progress" },
  { href: "/club", icon: Users2, label: "Club" },
  { href: "/settings", icon: User, label: "Profile" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50"
      style={{
        background: "rgba(13,13,16,0.92)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid var(--border)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex items-stretch h-16">
        {TABS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors",
                active ? "" : "opacity-40"
              )}
              style={{ color: active ? "var(--accent)" : "var(--muted)" }}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[9px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
