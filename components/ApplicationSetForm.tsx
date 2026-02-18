"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveApplication } from "@/app/actions"; // We can reuse this as it's generic
import { Loader2, Save, Plus, Trash2 } from "lucide-react";

interface ApplicationSetFormProps {
  repo: string;
}

export default function ApplicationSetForm({ repo }: ApplicationSetFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    namespace: "argocd",
    filePath: "argocd/applicationsets/my-set.yaml",
    // Template fields
    project: "default",
    repoURL: "",
    path: "",
    targetRevision: "HEAD",
    destinationNamespace: "default",
    autoSync: true,
    // Git Generator specific
    gitRepoURL: "",
    gitRevision: "HEAD",
    gitPath: "*",
  });

  const [generatorType, setGeneratorType] = useState<"list" | "git">("list");
  const [clusters, setClusters] = useState<{ name: string }[]>([
    { name: "in-cluster" },
  ]);
  const [valueFiles, setValueFiles] = useState<string[]>([]);

  const addCluster = () => {
    setClusters([...clusters, { name: "" }]);
  };

  const removeCluster = (index: number) => {
    const newClusters = [...clusters];
    newClusters.splice(index, 1);
    setClusters(newClusters);
  };

  const updateCluster = (index: number, value: string) => {
    const newClusters = [...clusters];
    newClusters[index].name = value;
    setClusters(newClusters);
  };

  const addValueFile = () => {
    setValueFiles([...valueFiles, ""]);
  };

  const removeValueFile = (index: number) => {
    const newFiles = [...valueFiles];
    newFiles.splice(index, 1);
    setValueFiles(newFiles);
  };

  const updateValueFile = (index: number, value: string) => {
    const newFiles = [...valueFiles];
    newFiles[index] = value;
    setValueFiles(newFiles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.filePath.endsWith(".yaml") && !formData.filePath.endsWith(".yml")) {
        throw new Error("File path must end with .yaml or .yml");
      }

      let generators: any[] = [];

      if (generatorType === "list") {
        if (clusters.length === 0) {
          throw new Error("At least one cluster is required for the List Generator");
        }
        generators = [
          {
            list: {
              elements: clusters.map((c) => ({ cluster: c.name })),
            },
          },
        ];
      } else {
        if (!formData.gitRepoURL) {
            throw new Error("Git Repo URL is required for Git Generator");
        }
        generators = [
            {
                git: {
                    repoURL: formData.gitRepoURL,
                    revision: formData.gitRevision,
                    directories: [
                        { path: formData.gitPath }
                    ]
                }
            }
        ]
      }

      const appSetManifest: any = {
        apiVersion: "argoproj.io/v1alpha1",
        kind: "ApplicationSet",
        metadata: {
          name: formData.name,
          namespace: formData.namespace,
        },
        spec: {
          generators: generators,
          template: {
            metadata: {
              name: generatorType === 'list' ? "{{cluster}}-{{name}}" : "{{path.basename}}-{{name}}", 
            },
            spec: {
              project: formData.project,
              source: {
                repoURL: formData.repoURL,
                path: formData.path,
                targetRevision: formData.targetRevision,
                helm: valueFiles.length > 0 ? {
                    valueFiles: valueFiles
                } : undefined
              },
              destination: {
                name: generatorType === 'list' ? "{{cluster}}" : "in-cluster", // Default to in-cluster for Git gen for now, or could be parameterized
                namespace: formData.destinationNamespace,
              },
            },
          },
        },
      };

      if (formData.autoSync) {
        appSetManifest.spec.template.spec.syncPolicy = {
          automated: {
            prune: true,
            selfHeal: true,
          },
        };
      }

      await saveApplication(repo, formData.filePath, appSetManifest, true);
      router.push(`/dashboard/${encodeURIComponent(repo)}`);
    } catch (err: any) {
      setError(err.message || "Failed to save ApplicationSet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-gray-800 p-8 rounded-xl border border-gray-700">
      
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        <div>
           <label className="block text-sm font-medium text-gray-400 mb-2">ApplicationSet Name</label>
           <input
             type="text"
             required
             value={formData.name}
             onChange={(e) => setFormData({ ...formData, name: e.target.value })}
             className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
             placeholder="my-app-set"
           />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">ArgoCD Namespace</label>
            <input
                type="text"
                required
                value={formData.namespace}
                onChange={(e) => setFormData({ ...formData, namespace: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
        </div>

        <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-white mb-4">Generator</h3>
            
            <div className="flex gap-4 mb-6">
                <button
                    type="button"
                    onClick={() => setGeneratorType("list")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${generatorType === "list" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-400 hover:text-white"}`}
                >
                    List Generator
                </button>
                <button
                    type="button"
                    onClick={() => setGeneratorType("git")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${generatorType === "git" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-400 hover:text-white"}`}
                >
                    Git Generator
                </button>
            </div>

            {generatorType === "list" ? (
                <>
                    <p className="text-sm text-gray-400 mb-4">Define the clusters where applications will be deployed.</p>
                    <div className="space-y-3">
                        {clusters.map((cluster, index) => (
                            <div key={index} className="flex gap-3 items-start">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        placeholder="Cluster Name (e.g., prod-us-east)"
                                        value={cluster.name}
                                        onChange={(e) => updateCluster(index, e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        required
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeCluster(index)}
                                    className="p-3 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                                    disabled={clusters.length === 1}
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                        
                        <button
                            type="button"
                            onClick={addCluster}
                            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium mt-2"
                        >
                            <Plus className="w-4 h-4" /> Add Cluster
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <p className="text-sm text-gray-400 mb-4">Scan a Git repository for directories.</p>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Git Repo URL</label>
                            <input
                                type="url"
                                required
                                value={formData.gitRepoURL}
                                onChange={(e) => setFormData({ ...formData, gitRepoURL: e.target.value })}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="https://github.com/owner/repo.git"
                            />
                        </div>
                         <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Revision</label>
                                <input
                                    type="text"
                                    value={formData.gitRevision}
                                    onChange={(e) => setFormData({ ...formData, gitRevision: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="HEAD"
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Path (Wildcard)</label>
                                <input
                                    type="text"
                                    value={formData.gitPath}
                                    onChange={(e) => setFormData({ ...formData, gitPath: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="clusters/*"
                                />
                            </div>
                         </div>
                    </div>
                </>
            )}
        </div>

        <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-white mb-4">Application Template</h3>
            
            <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Project</label>
                    <input
                        type="text"
                        required
                        value={formData.project}
                        onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                
                 <div>
                   <label className="block text-sm font-medium text-gray-400 mb-2">Repo URL</label>
                    <input
                        type="url"
                        required
                        value={formData.repoURL}
                        onChange={(e) => setFormData({ ...formData, repoURL: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="https://github.com/owner/repo.git"
                    />
                </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Path</label>
                        <input
                            type="text"
                            value={formData.path}
                            onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="k8s/overlays/prod"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Revision</label>
                        <input
                            type="text"
                            value={formData.targetRevision}
                            onChange={(e) => setFormData({ ...formData, targetRevision: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="HEAD"
                        />
                    </div>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Destination Namespace</label>
                    <input
                        type="text"
                        required
                        value={formData.destinationNamespace}
                        onChange={(e) => setFormData({ ...formData, destinationNamespace: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                
                 <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Helm Values Files</label>
                    <div className="space-y-3">
                        {valueFiles.map((file, index) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    type="text"
                                    value={file}
                                    onChange={(e) => updateValueFile(index, e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    placeholder="values.yaml"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeValueFile(index)}
                                    className="p-3 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                         <button
                            type="button"
                            onClick={addValueFile}
                            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium"
                        >
                            <Plus className="w-4 h-4" /> Add Values File
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-white mb-4">Sync Policy</h3>
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="autoSync"
                    checked={formData.autoSync}
                    onChange={(e) => setFormData({ ...formData, autoSync: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600 focus:ring-offset-gray-800"
                />
                <label htmlFor="autoSync" className="text-sm font-medium text-gray-300">
                    Enable Auto-Sync (Automated Prune & Self-Heal)
                </label>
            </div>
        </div>

         <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-white mb-4">File Settings</h3>
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Manifest File Path</label>
                <input
                    type="text"
                    required
                    value={formData.filePath}
                    onChange={(e) => setFormData({ ...formData, filePath: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="argocd/applicationsets/my-set.yaml"
                />
            </div>
        </div>

        <div className="pt-6">
             <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Create ApplicationSet
              </button>
        </div>

      </div>
    </form>
  );
}
