
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGitProvider } from "@/lib/git";
import { redirect } from "next/navigation";
import RepoList from "./RepoList";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const provider = getGitProvider(session.accessToken as string, session.provider as string);
  const { repos, nextCursor } = await provider.listRepos();

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

      <RepoList initialRepos={repos} initialNextCursor={nextCursor} />
    </div>
  );
}
