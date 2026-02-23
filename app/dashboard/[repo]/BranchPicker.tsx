"use client";

import { useRouter, useSearchParams, useParams } from "next/navigation";
import { GitBranch, ChevronDown } from "lucide-react";
import { useState, useTransition } from "react";

export default function BranchPicker({
  branches,
  currentBranch,
}: {
  branches: string[];
  currentBranch?: string;
}) {
  const router = useRouter();
  const params = useParams<{ repo: string }>();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSelect = (branch: string) => {
    setOpen(false);
    startTransition(() => {
      router.push(
        `/dashboard/${params.repo}?branch=${encodeURIComponent(branch)}`
      );
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-2 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg transition-all duration-150 active:scale-95 ${isPending ? "opacity-60" : ""}`}
      >
        <GitBranch className="w-3.5 h-3.5 text-gray-400" />
        <span className="max-w-[140px] truncate">{currentBranch || "Default"}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          {/* backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-gray-800 border border-gray-700 rounded-lg shadow-xl min-w-[180px] max-h-64 overflow-y-auto py-1">
            {branches.map((branch) => (
              <button
                key={branch}
                type="button"
                onClick={() => handleSelect(branch)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors flex items-center gap-2 ${
                  branch === currentBranch ? "text-blue-400 font-medium" : "text-gray-300"
                }`}
              >
                <GitBranch className="w-3.5 h-3.5 shrink-0 opacity-60" />
                {branch}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
