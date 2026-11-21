import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const googleClientId =
  process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
const googleClientSecret =
  process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;

if (!googleClientId || !googleClientSecret) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[Reelix Auth] Warning: AUTH_GOOGLE_ID or AUTH_GOOGLE_SECRET is not configured in environment variables. See .env.example for instructions."
    );
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: googleClientId || "",
      clientSecret: googleClientSecret || "",
      checks: ["state"],
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "reelix-development-auth-secret-replace-with-openssl-rand-base64-32",
  trustHost: true,
  debug: true,
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token) {
        session.user.id = (token.id as string) || (token.sub as string);
      }
      return session;
    },
  },
});
