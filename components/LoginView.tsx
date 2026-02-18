"use client";

import { signIn } from "next-auth/react";
import { Github, Gitlab } from "lucide-react";

interface LoginViewProps {
  showGithub: boolean;
  showGitlab: boolean;
}

export default function LoginView({ showGithub, showGitlab }: LoginViewProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="z-10 w-full max-w-5xl items-center justify-center font-mono text-sm lg:flex">
        <div className="bg-white/10 p-8 rounded-xl backdrop-blur-md border border-white/20 shadow-xl flex flex-col items-center gap-6 w-full max-w-md">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            ArgoCD Generator
          </h1>
          <p className="text-gray-300 text-center">
            Manage your ArgoCD applications with ease.
          </p>
          
          <div className="flex flex-col gap-4 w-full">
            {showGithub && (
              <button
                onClick={() => signIn("github")}
                className="flex items-center justify-center gap-3 bg-[#24292e] hover:bg-[#2f363d] text-white py-3 px-4 rounded-lg transition-all duration-200 font-medium"
              >
                <Github className="w-5 h-5" />
                Sign in with GitHub
              </button>
            )}
            
            {showGitlab && (
              <button
                onClick={() => signIn("gitlab")}
                className="flex items-center justify-center gap-3 bg-[#fc6d26] hover:bg-[#e24329] text-white py-3 px-4 rounded-lg transition-all duration-200 font-medium"
              >
                <Gitlab className="w-5 h-5" />
                Sign in with GitLab
              </button>
            )}

            {!showGithub && !showGitlab && (
                <div className="text-center text-red-400 p-4 border border-red-500/50 rounded-lg bg-red-500/10">
                    No authentication providers configured. Please check your environment variables.
                </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
