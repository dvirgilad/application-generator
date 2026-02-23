"use client";

import { useState } from "react";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { deleteApplication } from "@/app/actions";

interface DeleteActionProps {
  repo: string;
  path: string;
  isAppSet: boolean;
  appName: string;
  branch?: string;
}

export default function DeleteAction({ repo, path, isAppSet, appName, branch }: DeleteActionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [commitMessage, setCommitMessage] = useState(`Delete ${isAppSet ? 'ApplicationSet' : 'Application'} ${appName}`);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteApplication(repo, path, isAppSet ? commitMessage : undefined, branch);
      setIsOpen(false);
    } catch (e) {
      console.error("Failed to delete", e);
      alert("Failed to delete application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center h-6 w-6 text-gray-500 hover:text-red-400 transition-colors"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4 text-red-400">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-xl font-bold text-white">Delete {appName}?</h2>
            </div>
            
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this {isAppSet ? 'ApplicationSet' : 'Application'}? This action cannot be undone and will commit the removal to your repository.
            </p>

            {isAppSet && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">Commit Message</label>
                <input
                  type="text"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={loading}
                className="px-4 py-2 rounded-lg font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white bg-red-600 hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
