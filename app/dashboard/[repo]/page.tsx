
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGitProvider } from "@/lib/git";
import Link from "next/link";
import { redirect } from "next/navigation";
import yaml from "js-yaml";
import { Plus, ArrowLeft, Settings, Trash2, ExternalLink } from "lucide-react";

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

export default async function RepoPage({ params }: { params: Promise<{ repo: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const { repo } = await params;
  const repoFullName = decodeURIComponent(repo);
  const provider = getGitProvider(session.accessToken as string, session.provider as string);

  // 1. Scan repo for all files
  const files = await provider.scanRepo(repoFullName);

  // 2. Filter for YAML files
  const yamlFiles = files.filter(f => f.name.endsWith(".yaml") || f.name.endsWith(".yml"));

  // 3. Fetch content and parse (limit to 20 for now to avoid hitting rate limits too hard in demo)
  // In production, we'd want a more robust queuing system or search API usage if possible.
const applications: { path: string; content: any }[] = [];

  for (const file of yamlFiles.slice(0, 20)) {
    try {
        const content = await provider.getFile(repoFullName, file.path);
        if (!content) continue;

        // Parse multiple documents if present
        const documents = yaml.loadAll(content) as any[];
        
        for (const doc of documents) {
            if (doc && (doc.kind === "Application" || doc.kind === "ApplicationSet") && doc.apiVersion?.startsWith("argoproj.io")) {
                applications.push({
                    path: file.path,
                    content: doc
                });
            }
        }
    } catch (e) {
        console.error(`Error parsing ${file.path}`, e);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
       <header className="mb-10 max-w-7xl mx-auto border-b border-gray-800 pb-6">
        <div className="flex items-center gap-4 mb-4">
             <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
             </Link>
        </div>
        <div className="flex justify-between items-center">
            <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                {repoFullName}
            </h1>
            <p className="text-gray-400 mt-2">ArgoCD Manifests</p>
            </div>
            <div className="flex gap-3">
                <Link
                    href={`/dashboard/${encodeURIComponent(repoFullName)}/new-set`}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-purple-600/20"
                >
                    <Plus className="w-4 h-4" />
                    New ApplicationSet
                </Link>
                <Link
                    href={`/dashboard/${encodeURIComponent(repoFullName)}/new`}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/20"
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
                                <div className="flex justify-between">
                                    <span>Dest:</span>
                                    <span className="text-gray-200">
                                        {app.content.kind === 'ApplicationSet' 
                                            ? `${app.content.spec?.generators?.length || 0} Generators`
                                            : (app.content.spec?.destination?.name || 'Server')
                                        }
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Namespace:</span>
                                    <span className="text-gray-200">{app.content.spec?.destination?.namespace || app.content.spec?.template?.spec?.destination?.namespace}</span>
                                </div>
                            </div>
                        </div>
                         <div className="bg-gray-900/50 px-6 py-3 border-t border-gray-700 text-xs font-mono text-gray-500 truncate">
                            Src: {app.content.spec?.source?.repoURL || app.content.spec?.template?.spec?.source?.repoURL}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </main>
    </div>
  );
}
