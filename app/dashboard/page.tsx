
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGitProvider } from "@/lib/git";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GitBranch, FolderGit2 } from "lucide-react";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const provider = getGitProvider(session.accessToken as string, session.provider as string);
  const repos = await provider.listRepos();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <header className="mb-10 flex justify-between items-center max-w-7xl mx-auto border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Dashboard
          </h1>
          <p className="text-gray-400 mt-2">Select a repository to manage applications</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-full border border-gray-700">
              {session.user?.image && (
                <img src={session.user.image} alt="Avatar" className="w-6 h-6 rounded-full" />
              )}
              <span className="text-sm font-medium">{session.user?.name}</span>
           </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {repos.map((repo) => (
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
        ))}
      </main>
    </div>
  );
}
