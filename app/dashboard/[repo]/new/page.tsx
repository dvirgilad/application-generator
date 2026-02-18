
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ApplicationForm from "@/components/ApplicationForm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewAppPage({ params }: { params: Promise<{ repo: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const { repo } = await params;
  const repoFullName = decodeURIComponent(repo);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <header className="mb-10 max-w-7xl mx-auto border-b border-gray-800 pb-6">
        <Link
          href={`/dashboard/${encodeURIComponent(repoFullName)}`}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Applications
        </Link>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          Create New Application
        </h1>
      </header>
      <main className="max-w-7xl mx-auto flex justify-center">
        <ApplicationForm repo={repoFullName} isNew={true} />
      </main>
    </div>
  );
}
