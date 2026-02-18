
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveApplication } from "@/app/actions";
import { Loader2, Save } from "lucide-react";

interface ApplicationFormProps {
  repo: string;
  initialData?: any;
  initialPath?: string;
  isNew?: boolean;
}

export default function ApplicationForm({ repo, initialData, initialPath, isNew = false }: ApplicationFormProps) {
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
    destinationName: initialData?.spec?.destination?.name || "in-cluster", // Changed to Name
    destinationNamespace: initialData?.spec?.destination?.namespace || "default",
    filePath: initialPath || "",
    autoSync: initialData?.spec?.syncPolicy?.automated ? true : false,
  });

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
          source: {
            repoURL: formData.repoURL,
            path: formData.path,
            targetRevision: formData.targetRevision,
          },
          destination: {
            name: formData.destinationName, // Changed to Name
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

      await saveApplication(repo, formData.filePath, appManifest, isNew);
      router.push(`/dashboard/${encodeURIComponent(repo)}`);
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
                className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {isNew ? "Create Application" : "Update Application"}
              </button>
        </div>
      </div>
    </form>
  );
}
