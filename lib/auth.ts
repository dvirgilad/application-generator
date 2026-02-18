
import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GitlabProvider from "next-auth/providers/gitlab";

const providers = [];

if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      authorization: {
        params: {
          scope: "repo read:user user:email",
        },
      },
    })
  );
}

if (process.env.GITLAB_ID && process.env.GITLAB_SECRET) {
  providers.push(
    GitlabProvider({
      clientId: process.env.GITLAB_ID,
      clientSecret: process.env.GITLAB_SECRET!,
      authorization: {
        url: process.env.GITLAB_BASE_URL ? `${process.env.GITLAB_BASE_URL}/oauth/authorize` : "https://gitlab.com/oauth/authorize",
        params: { scope: "api read_user" },
      },
      token: process.env.GITLAB_BASE_URL ? `${process.env.GITLAB_BASE_URL}/oauth/token` : "https://gitlab.com/oauth/token",
      userinfo: process.env.GITLAB_BASE_URL ? `${process.env.GITLAB_BASE_URL}/api/v4/user` : "https://gitlab.com/api/v4/user",
      issuer: process.env.GITLAB_BASE_URL,
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.provider = token.provider as string;
      return session;
    },
  },
  pages: {
    signIn: "/", // Custom sign-in page
  },
  secret: process.env.NEXTAUTH_SECRET,
};
