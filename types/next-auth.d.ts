
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    accessToken?: string;
    provider?: string;
    user: {
      /** The user's postal address. */
      address?: string;
    } & DefaultSession["user"];
  }

  interface Profile {
    id: string;
    login: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    provider?: string;
  }
}
