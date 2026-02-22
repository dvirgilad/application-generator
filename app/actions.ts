
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGitProvider } from "@/lib/git";
import { revalidatePath } from "next/cache";
import yaml from "js-yaml";

export async function saveApplication(repo: string, path: string, content: any, isNew: boolean) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Unauthorized");
  }

  const provider = getGitProvider(session.accessToken as string, session.provider as string);
  const yamlContent = yaml.dump(content);
  
  const message = isNew 
    ? `Create ArgoCD application ${content.metadata.name}`
    : `Update ArgoCD application ${content.metadata.name}`;

  await provider.saveFile(repo, path, yamlContent, message);
  revalidatePath(`/dashboard/${encodeURIComponent(repo)}`);
  revalidatePath(`/dashboard/${encodeURIComponent(repo)}`, "page");
}

export async function deleteApplication(repo: string, path: string) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Unauthorized");
  }

  const provider = getGitProvider(session.accessToken as string, session.provider as string);
  await provider.deleteFile(repo, path, `Delete application at ${path}`);
  revalidatePath(`/dashboard/${encodeURIComponent(repo)}`);
  revalidatePath(`/dashboard/${encodeURIComponent(repo)}`, "page");
}
