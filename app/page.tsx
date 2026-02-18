
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginView from "@/components/LoginView";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  const showGithub = !!(process.env.GITHUB_ID && process.env.GITHUB_SECRET);
  const showGitlab = !!(process.env.GITLAB_ID && process.env.GITLAB_SECRET);

  return <LoginView showGithub={showGithub} showGitlab={showGitlab} />;
}
