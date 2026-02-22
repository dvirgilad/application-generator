
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGitProvider } from "@/lib/git";
import ApplicationForm from "@/components/ApplicationForm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import yaml from "js-yaml";

export default async function EditAppPage({
  params,
  searchParams,
}: {
  params: Promise<{ repo: string }>;
  searchParams: Promise<{ path: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const { repo } = await params;
  const { path: filePath } = await searchParams;
  const repoFullName = decodeURIComponent(repo);

  if (!filePath) {
    redirect(`/dashboard/${encodeURIComponent(repoFullName)}`);
  }

  const provider = getGitProvider(session.accessToken as string, session.provider as string);
  const content = await provider.getFile(repoFullName, filePath);

  if (!content) {
    return <div>File not found</div>;
  }

  let initialData;
  try {
      // Load first document if multiple
      const docs = yaml.loadAll(content);
      initialData = docs[0];
  } catch (e) {
      return <div>Error parsing YAML</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <header className="mb-10 max-w-7xl mx-auto border-b border-gray-800 pb-6">
        <Link
          href={`/dashboard/${encodeURIComponent(repoFullName)}`}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-1.5 rounded-lg transition-all duration-150 active:scale-95 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Applications
        </Link>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          Edit Application
        </h1>
        <p className="text-gray-400 mt-2 font-mono text-xs">{filePath}</p>
      </header>
      <main className="max-w-7xl mx-auto flex justify-center">
        <ApplicationForm
          repo={repoFullName}
          isNew={false}
          initialData={initialData}
          initialPath={filePath}
        />
      </main>
    </div>
  );
}
