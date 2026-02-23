
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGitProvider } from "@/lib/git";
import { revalidatePath } from "next/cache";
import yaml from "js-yaml";

export async function saveApplication(repo: string, path: string, content: any, isNew: boolean, commitMessage?: string, branch?: string) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Unauthorized");
  }

  const provider = getGitProvider(session.accessToken as string, session.provider as string);
  const yamlContent = yaml.dump(content);
  
  const defaultMessage = isNew 
    ? `Create ArgoCD application ${content.metadata.name}`
    : `Update ArgoCD application ${content.metadata.name}`;
  const message = commitMessage || defaultMessage;

  await provider.saveFile(repo, path, yamlContent, message, branch);
  revalidatePath(`/dashboard/${encodeURIComponent(repo)}`);
  revalidatePath(`/dashboard/${encodeURIComponent(repo)}`, "page");
}

export async function deleteApplication(repo: string, path: string, commitMessage?: string, branch?: string) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Unauthorized");
  }

  const provider = getGitProvider(session.accessToken as string, session.provider as string);
  const message = commitMessage || `Delete application at ${path}`;
  await provider.deleteFile(repo, path, message, branch);
  revalidatePath(`/dashboard/${encodeURIComponent(repo)}`);
  revalidatePath(`/dashboard/${encodeURIComponent(repo)}`, "page");
}

export async function fetchMoreRepos(cursor: string) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Unauthorized");
  }
  const provider = getGitProvider(session.accessToken as string, session.provider as string);
  return provider.listRepos(cursor);
}

export async function rescanRepo(repo: string) {
  revalidatePath(`/dashboard/${encodeURIComponent(repo)}`);
  revalidatePath(`/dashboard/${encodeURIComponent(repo)}`, "page");
}
