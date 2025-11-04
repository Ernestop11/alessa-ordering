import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { JWT } from 'next-auth/jwt';
import type { Session, User } from 'next-auth';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@restaurant.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD;

type AdminRole = 'admin' | 'super_admin';

type TokenWithRole = JWT & { role?: AdminRole };
type SessionWithRole = Session & { user: Session['user'] & { role?: AdminRole } };

interface CandidateUser {
  id: string;
  email: string;
  password: string;
  role: AdminRole;
  name: string;
}

type AdminUser = User & { role: AdminRole };

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const candidates: CandidateUser[] = [
          {
            id: 'admin',
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            role: 'admin',
            name: 'Restaurant Admin',
          },
        ];

        if (SUPER_ADMIN_EMAIL && SUPER_ADMIN_PASSWORD) {
          candidates.push({
            id: 'super_admin',
            email: SUPER_ADMIN_EMAIL,
            password: SUPER_ADMIN_PASSWORD,
            role: 'super_admin',
            name: 'Super Admin',
          });
        }

        const match = candidates.find(
          (candidate) =>
            candidate.email &&
            candidate.password &&
            credentials.email === candidate.email &&
            credentials.password === candidate.password,
        );

        if (match) {
          const { password, ...rest } = match;
          return rest as AdminUser;
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      const typedToken = token as TokenWithRole;
      const typedUser = user as AdminUser | undefined;
      if (typedUser?.role) {
        typedToken.role = typedUser.role;
      }
      return typedToken;
    },
    async session({ session, token }) {
      const typedSession = session as SessionWithRole;
      const typedToken = token as TokenWithRole;
      if (typedToken?.role) {
        typedSession.user.role = typedToken.role;
      }
      return typedSession;
    },
  },
};
