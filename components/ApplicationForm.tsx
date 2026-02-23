
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveApplication } from "@/app/actions";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";

interface ApplicationFormProps {
  repo: string;
  initialData?: any;
  initialPath?: string;
  isNew?: boolean;
  branch?: string;
}

export default function ApplicationForm({ repo, initialData, initialPath, isNew = false, branch }: ApplicationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: initialData?.metadata?.name || "",
    namespace: initialData?.metadata?.namespace || "argocd",
    project: initialData?.spec?.project || "default",
    repoURL: initialData?.spec?.source?.repoURL || "",
    path: initialData?.spec?.source?.path || "",
    targetRevision: initialData?.spec?.source?.targetRevision || "HEAD",
    destinationName: initialData?.spec?.destination?.name || "in-cluster",
    destinationNamespace: initialData?.spec?.destination?.namespace || "default",
    filePath: initialPath || "",
    autoSync: initialData?.spec?.syncPolicy?.automated ? true : false,
  });

  const [inlineValues, setInlineValues] = useState<string>(
    initialData?.spec?.source?.helm?.values ||
    initialData?.spec?.sources?.[0]?.helm?.values ||
    ""
  );
  const [valueFiles, setValueFiles] = useState<string[]>(
    initialData?.spec?.source?.helm?.valueFiles ||
    initialData?.spec?.sources?.[0]?.helm?.valueFiles ||
    []
  );

  interface ExternalRepo { ref: string; repoURL: string; targetRevision: string; }
  const [externalValueRepos, setExternalValueRepos] = useState<ExternalRepo[]>(
    (initialData?.spec?.sources?.slice(1) || []).map((s: any) => ({
      ref: s.ref || "",
      repoURL: s.repoURL || "",
      targetRevision: s.targetRevision || "HEAD",
    }))
  );

  const addValueFile = () => setValueFiles([...valueFiles, ""]);
  const removeValueFile = (i: number) => setValueFiles(valueFiles.filter((_, idx) => idx !== i));
  const updateValueFile = (i: number, v: string) =>
    setValueFiles(valueFiles.map((f, idx) => (idx === i ? v : f)));

  const addExternalRepo = () =>
    setExternalValueRepos([...externalValueRepos, { ref: "", repoURL: "", targetRevision: "HEAD" }]);
  const removeExternalRepo = (i: number) =>
    setExternalValueRepos(externalValueRepos.filter((_, idx) => idx !== i));
  const updateExternalRepo = (i: number, field: keyof ExternalRepo, v: string) =>
    setExternalValueRepos(externalValueRepos.map((r, idx) => idx === i ? { ...r, [field]: v } : r));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.filePath.endsWith(".yaml") && !formData.filePath.endsWith(".yml")) {
          throw new Error("File path must end with .yaml or .yml");
      }

      const appManifest: any = {
        apiVersion: "argoproj.io/v1alpha1",
        kind: "Application",
        metadata: {
          name: formData.name,
          namespace: formData.namespace,
        },
        spec: {
          project: formData.project,
          ...(externalValueRepos.length > 0
            ? {
                // Multi-source mode: chart source first, then value repos with ref aliases
                sources: [
                  {
                    repoURL: formData.repoURL,
                    path: formData.path,
                    targetRevision: formData.targetRevision,
                    ...(inlineValues || valueFiles.length > 0
                      ? { helm: { ...(inlineValues ? { values: inlineValues } : {}), ...(valueFiles.length > 0 ? { valueFiles } : {}) } }
                      : {}),
                  },
                  ...externalValueRepos.map((r) => ({
                    repoURL: r.repoURL,
                    targetRevision: r.targetRevision,
                    ref: r.ref,
                  })),
                ],
              }
            : {
                source: {
                  repoURL: formData.repoURL,
                  path: formData.path,
                  targetRevision: formData.targetRevision,
                  ...(inlineValues || valueFiles.length > 0
                    ? { helm: { ...(inlineValues ? { values: inlineValues } : {}), ...(valueFiles.length > 0 ? { valueFiles } : {}) } }
                    : {}),
                },
              }),
          destination: {
            name: formData.destinationName,
            namespace: formData.destinationNamespace,
          },
        },
      };

      if (formData.autoSync) {
        appManifest.spec.syncPolicy = {
          automated: {
            prune: true,
            selfHeal: true,
          },
        };
      }

      await saveApplication(repo, formData.filePath, appManifest, isNew, undefined, branch);
      router.push(`/dashboard/${encodeURIComponent(repo)}${branch ? `?branch=${encodeURIComponent(branch)}` : ""}`);
    } catch (err: any) {
      setError(err.message || "Failed to save application");
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
           <label className="block text-sm font-medium text-gray-400 mb-2">Application Name</label>
           <input
             type="text"
             required
             value={formData.name}
             onChange={(e) => setFormData({ ...formData, name: e.target.value })}
             className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
             placeholder="my-app"
           />
        </div>

        <div className="grid grid-cols-2 gap-6">
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
        </div>

        <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-white mb-4">Source</h3>
            <div className="space-y-4">
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
            </div>
        </div>

        <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-white mb-4">Helm Values</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Inline Values (YAML)</label>
                    <textarea
                        rows={8}
                        value={inlineValues}
                        onChange={(e) => setInlineValues(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                        placeholder={`replicaCount: 1\nimage:\n  tag: latest`}
                        spellCheck={false}
                    />
                    <p className="text-xs text-gray-500 mt-1">Helm values in YAML format, inlined into the manifest.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Values File Sources</label>
                    <p className="text-xs text-gray-500 mb-3">
                      Use <code className="bg-gray-900 px-1 rounded">$ref/path/to/values.yaml</code> to reference files from an external repo below.
                    </p>
                    <div className="space-y-3">
                        {valueFiles.map((file, index) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    type="text"
                                    value={file}
                                    onChange={(e) => updateValueFile(index, e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    placeholder="values.yaml  or  $myrepo/config/values.yaml"
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

                <div className="border border-gray-700 rounded-lg p-4 bg-gray-900/40">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-sm font-medium text-gray-300">External Value Repos</p>
                            <p className="text-xs text-gray-500 mt-0.5">Additional git repos to fetch value files from. Each gets a <code className="bg-gray-800 px-1 rounded">ref</code> alias you can use in the paths above.</p>
                        </div>
                        <button
                            type="button"
                            onClick={addExternalRepo}
                            className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 font-medium shrink-0"
                        >
                            <Plus className="w-4 h-4" /> Add Repo
                        </button>
                    </div>
                    {externalValueRepos.length === 0 ? (
                        <p className="text-xs text-gray-600 italic">No external repos added.</p>
                    ) : (
                        <div className="space-y-4">
                            {externalValueRepos.map((repo, index) => (
                                <div key={index} className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
                                    {/* Row 1: Ref Alias | Repo URL | Trash */}
                                    <div className="flex gap-3 items-end">
                                        <div className="w-32 shrink-0">
                                            <label className="block text-xs font-medium text-gray-400 mb-1">Ref Alias</label>
                                            <input
                                                type="text"
                                                value={repo.ref}
                                                onChange={(e) => updateExternalRepo(index, "ref", e.target.value)}
                                                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                placeholder="myrepo"
                                                required={externalValueRepos.length > 0}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium text-gray-400 mb-1">Repo URL</label>
                                            <input
                                                type="url"
                                                value={repo.repoURL}
                                                onChange={(e) => updateExternalRepo(index, "repoURL", e.target.value)}
                                                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                placeholder="https://github.com/owner/values-repo.git"
                                                required={externalValueRepos.length > 0}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeExternalRepo(index)}
                                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {/* Row 2: Revision */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Revision</label>
                                        <input
                                            type="text"
                                            value={repo.targetRevision}
                                            onChange={(e) => updateExternalRepo(index, "targetRevision", e.target.value)}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                            placeholder="HEAD"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-white mb-4">Destination</h3>
             <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Cluster Name</label>
                        <input
                            type="text"
                            required
                            value={formData.destinationName}
                            onChange={(e) => setFormData({ ...formData, destinationName: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="in-cluster"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Namespace</label>
                        <input
                            type="text"
                            required
                            value={formData.destinationNamespace}
                            onChange={(e) => setFormData({ ...formData, destinationNamespace: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
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
                    placeholder="argocd/applications/my-app.yaml"
                    disabled={!isNew}
                />
                 {!isNew && <p className="text-xs text-gray-500 mt-1">File path cannot be changed in edit mode.</p>}
            </div>
        </div>

        <div className="pt-6">
             <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-150"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {isNew ? "Create Application" : "Update Application"}
              </button>
        </div>
      </div>
    </form>
  );
}
