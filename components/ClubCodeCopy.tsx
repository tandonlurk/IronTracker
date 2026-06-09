"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function ClubCodeCopy({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className="w-10 h-10 flex items-center justify-center rounded-xl transition-colors"
      style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
    >
      {copied ? <Check size={16} style={{ color: "var(--green)" }} /> : <Copy size={16} />}
    </button>
  );
}
