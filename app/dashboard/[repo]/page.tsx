
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGitProvider } from "@/lib/git";
import Link from "next/link";
import { redirect } from "next/navigation";
import yaml from "js-yaml";
import { Plus, ArrowLeft, Settings, ExternalLink } from "lucide-react";
import RescanButton from "./RescanButton";
import BranchPicker from "./BranchPicker";

interface ArgoApplication {
  metadata: {
    name: string;
    namespace?: string;
  };
  spec: {
    source: {
      repoURL: string;
      path?: string;
      chart?: string;
      targetRevision?: string;
    };
    destination: {
      server?: string;
      name?: string;
      namespace: string;
    };
    project: string;
  };
}

export default async function RepoPage({
  params,
  searchParams,
}: {
  params: Promise<{ repo: string }>;
  searchParams: Promise<{ branch?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const { repo } = await params;
  const { branch: branchParam } = await searchParams;
  const repoFullName = decodeURIComponent(repo);
  const provider = getGitProvider(session.accessToken as string, session.provider as string);

  // Fetch branches + scan repo in parallel
  const [branches, files] = await Promise.all([
    provider.listBranches(repoFullName),
    provider.scanRepo(repoFullName, branchParam || undefined),
  ]);

  const currentBranch = branchParam || branches[0] || "HEAD";

  // Filter for YAML files
  const yamlFiles = files.filter(f => f.name.endsWith(".yaml") || f.name.endsWith(".yml"));

  // Fetch all YAML files in parallel (capped at 30 to avoid rate limits)
  const FILE_LIMIT = 30;
  const contents = await Promise.all(
    yamlFiles.slice(0, FILE_LIMIT).map(f => provider.getFile(repoFullName, f.path, currentBranch))
  );

  const applications: { path: string; content: any }[] = [];
  for (let i = 0; i < contents.length; i++) {
    const content = contents[i];
    if (!content) continue;
    try {
      const documents = yaml.loadAll(content) as any[];
      for (const doc of documents) {
        if (doc && (doc.kind === "Application" || doc.kind === "ApplicationSet") && doc.apiVersion?.startsWith("argoproj.io")) {
          applications.push({ path: yamlFiles[i].path, content: doc });
        }
      }
    } catch (e) {
      console.error(`Error parsing ${yamlFiles[i].path}`, e);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
       <header className="mb-10 max-w-7xl mx-auto border-b border-gray-800 pb-6">
         <div className="flex items-center gap-3 mb-4">
              <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-1.5 rounded-lg transition-all duration-150 active:scale-95">
                 <ArrowLeft className="w-4 h-4" />
                 Back to Dashboard
              </Link>
              {branches.length > 0 && (
                <BranchPicker branches={branches} currentBranch={currentBranch} />
              )}
         </div>
        <div className="flex justify-between items-center">
            <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                {repoFullName}
            </h1>
            <p className="text-gray-400 mt-2">ArgoCD Manifests</p>
            </div>
            <div className="flex gap-3">
                <RescanButton />
                <Link
                    href={`/dashboard/${encodeURIComponent(repoFullName)}/new-set`}
                    className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white px-4 py-2 rounded-lg font-medium transition-all duration-150 shadow-lg shadow-purple-600/20"
                >
                    <Plus className="w-4 h-4" />
                    New ApplicationSet
                </Link>
                <Link
                    href={`/dashboard/${encodeURIComponent(repoFullName)}/new`}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white px-4 py-2 rounded-lg font-medium transition-all duration-150 shadow-lg shadow-blue-600/20"
                >
                    <Plus className="w-4 h-4" />
                    New Application
                </Link>
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {applications.length === 0 ? (
             <div className="text-center py-20 bg-gray-800/50 rounded-xl border border-gray-800 border-dashed">
                <p className="text-gray-400">No ArgoCD Manifests found in scanned files.</p>
                <p className="text-sm text-gray-500 mt-2">Scanned {yamlFiles.length} YAML files.</p>
             </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {applications.map((app, idx) => (
                    <div key={idx} className={`bg-gray-800 rounded-xl border ${app.content.kind === 'ApplicationSet' ? 'border-purple-500/30 hover:border-purple-500 hover:shadow-purple-500/10' : 'border-gray-700 hover:border-blue-500 hover:shadow-blue-500/10'} transition-all duration-200 overflow-hidden shadow-lg`}>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-2 rounded-lg ${app.content.kind === 'ApplicationSet' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                    <ExternalLink className="w-6 h-6" />
                                </div>
                                <div className="flex gap-2">
                                     <span className={`text-xs px-2 py-1 rounded-full border ${app.content.kind === 'ApplicationSet' ? 'border-purple-500/30 text-purple-400' : 'border-blue-500/30 text-blue-400'}`}>
                                        {app.content.kind}
                                     </span>
                                     {/* Edit/Delete would go here. For now, links. */}
                                    <Link href={`/dashboard/${encodeURIComponent(repoFullName)}/edit?path=${encodeURIComponent(app.path)}`} className="text-gray-500 hover:text-white">
                                        <Settings className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                            
                            <h3 className="text-lg font-semibold text-gray-200 mb-1 truncate">
                                {app.content.metadata.name}
                            </h3>
                            <p className="text-xs text-gray-500 font-mono mb-4 truncate">
                                {app.path}
                            </p>

                            <div className="space-y-2 text-sm text-gray-400">
                                <div className="flex justify-between">
                                    <span>Project:</span>
                                    <span className="text-gray-200">{app.content.spec?.project || app.content.spec?.template?.spec?.project}</span>
                                </div>

                                {app.content.kind === 'ApplicationSet' ? (
                                    <>
                                        <div className="flex justify-between">
                                            <span>Generator:</span>
                                            <span className="text-gray-200 capitalize">
                                                {Object.keys(app.content.spec?.generators?.[0] || {})[0] || '—'}
                                                {app.content.spec?.generators?.length > 1 && ` +${app.content.spec.generators.length - 1}`}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Template namespace:</span>
                                            <span className="text-gray-200">{app.content.spec?.template?.spec?.destination?.namespace || '—'}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex justify-between">
                                            <span>Cluster:</span>
                                            <span className="text-gray-200">{app.content.spec?.destination?.name || app.content.spec?.destination?.server || '—'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Namespace:</span>
                                            <span className="text-gray-200">{app.content.spec?.destination?.namespace || '—'}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="bg-gray-900/50 px-6 py-3 border-t border-gray-700 text-xs font-mono text-gray-500 truncate">
                            {app.content.kind === 'ApplicationSet'
                                ? `${app.content.spec?.generators?.length || 0} generator(s) · ${app.content.spec?.template?.spec?.source?.repoURL || app.content.spec?.template?.spec?.sources?.[0]?.repoURL || '—'}`
                                : `Src: ${app.content.spec?.source?.repoURL || app.content.spec?.sources?.[0]?.repoURL || '—'}`
                            }
                        </div>
                    </div>
                ))}
            </div>
        )}
      </main>
    </div>
  );
}
