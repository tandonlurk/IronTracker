import TemplateEditor from "@/components/TemplateEditor";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function NewTemplatePage() {
  return (
    <div className="flex flex-col gap-5 px-4 pt-10 pb-6">
      <div className="flex items-center gap-3">
        <Link href="/templates" style={{ color: "var(--muted)" }}>
          <ChevronLeft size={22} />
        </Link>
        <h1 className="text-2xl font-bold">New Template</h1>
      </div>
      <TemplateEditor />
    </div>
  );
}
