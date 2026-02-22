"use client";

import { useState } from "react";
import Link from "next/link";
import { GitBranch, FolderGit2, Search, ChevronDown } from "lucide-react";
import type { Repository } from "@/lib/git";

const PAGE_SIZE = 30;

export default function RepoList({ repos }: { repos: Repository[] }) {
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = repos.filter(
    (r) =>
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      r.fullName.toLowerCase().includes(query.toLowerCase())
  );

  const visible = filtered.slice(0, visibleCount);

  return (
    <>
      <div className="max-w-7xl mx-auto mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search repositories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>
      </div>

      <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visible.length === 0 ? (
          <p className="text-gray-500 col-span-3 text-center py-12">
            No repositories match &ldquo;{query}&rdquo;
          </p>
        ) : (
          visible.map((repo) => (
            <Link
              key={repo.fullName}
              href={`/dashboard/${encodeURIComponent(repo.fullName)}`}
              className="group relative bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 group-hover:text-blue-300 transition-colors">
                  <FolderGit2 className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono text-gray-500 border border-gray-700 px-2 py-1 rounded bg-gray-900">
                  {repo.defaultBranch}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-200 group-hover:text-white mb-2 truncate">
                {repo.name}
              </h3>
              <p className="text-sm text-gray-500 truncate mb-4">
                {repo.fullName}
              </p>

              <div className="flex items-center text-xs text-gray-500 gap-2">
                <GitBranch className="w-3 h-3" />
                <span>Git Repository</span>
              </div>
            </Link>
          ))
        )}
      </main>

      {filtered.length > visibleCount && (
        <div className="max-w-7xl mx-auto mt-8 flex justify-center">
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white px-6 py-2.5 rounded-lg transition-colors text-sm"
          >
            <ChevronDown className="w-4 h-4" />
            Load more ({filtered.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </>
  );
}
