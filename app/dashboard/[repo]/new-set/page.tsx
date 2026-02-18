import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ApplicationSetForm from "@/components/ApplicationSetForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewAppSetPage({ params }: { params: Promise<{ repo: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const { repo } = await params;
  const repoFullName = decodeURIComponent(repo);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link
            href={`/dashboard/${encodeURIComponent(repoFullName)}`}
            className="inline-flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Application List
          </Link>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Create New ApplicationSet
          </h1>
          <p className="text-gray-400 mt-2">
            Generate an ApplicationSet manifest in <code>{repoFullName}</code>
          </p>
        </div>

        <ApplicationSetForm repo={repoFullName} />
      </div>
    </div>
  );
}
