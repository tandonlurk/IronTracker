import { auth } from "@/auth";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex flex-col min-h-dvh" style={{ paddingBottom: "calc(64px + env(safe-area-inset-bottom))" }}>
      <main className="flex-1">{children}</main>
      <BottomNav />
    </div>
  );
}
