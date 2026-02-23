"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { rescanRepo } from "@/app/actions";

export default function RescanButton({ repo }: { repo: string }) {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);

  const handleRescan = async () => {
    setScanning(true);
    await rescanRepo(repo);
    router.refresh();
    setTimeout(() => setScanning(false), 500);
  };

  return (
    <button
      onClick={handleRescan}
      disabled={scanning}
      className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-all duration-150"
    >
      <RefreshCw className={`w-4 h-4 ${scanning ? "animate-spin" : ""}`} />
      {scanning ? "Scanning…" : "Re-scan"}
    </button>
  );
}
