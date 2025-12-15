import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { JWT } from 'next-auth/jwt';
import type { Session, User } from 'next-auth';

// Super Admin credentials
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD;

// Tenant-specific admin credentials (from env)
// Format: TENANT_ADMIN_{SLUG}_EMAIL and TENANT_ADMIN_{SLUG}_PASSWORD
const TENANT_ADMINS: Record<string, { email: string; password: string; name: string }> = {
  lasreinas: {
    email: process.env.TENANT_ADMIN_LASREINAS_EMAIL || 'admin@lasreinas.com',
    password: process.env.TENANT_ADMIN_LASREINAS_PASSWORD || 'LasReinas2024!',
    name: 'Las Reinas Admin',
  },
  lapoblanita: {
    email: process.env.TENANT_ADMIN_LAPOBLANITA_EMAIL || 'admin@lapoblanita.com',
    password: process.env.TENANT_ADMIN_LAPOBLANITA_PASSWORD || 'LaPoblanita2024!',
    name: 'La Poblanita Admin',
  },
};

// Legacy single admin (backwards compatible)
const LEGACY_ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const LEGACY_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

type AdminRole = 'admin' | 'super_admin';

type TokenWithRole = JWT & { role?: AdminRole; tenantSlug?: string };
type SessionWithRole = Session & { user: Session['user'] & { role?: AdminRole; tenantSlug?: string } };

interface CandidateUser {
  id: string;
  email: string;
  password: string;
  role: AdminRole;
  name: string;
  tenantSlug?: string; // Tenant slug for tenant admins
}

type AdminUser = User & { role: AdminRole; tenantSlug?: string };

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

        const candidates: CandidateUser[] = [];

        // Add all tenant-specific admins
        Object.entries(TENANT_ADMINS).forEach(([slug, admin]) => {
          if (admin.email && admin.password) {
            candidates.push({
              id: `admin_${slug}`,
              email: admin.email,
              password: admin.password,
              role: 'admin',
              name: admin.name,
              tenantSlug: slug, // Store tenant slug for routing
            });
          }
        });

        // Legacy single admin (backwards compatible)
        if (LEGACY_ADMIN_EMAIL && LEGACY_ADMIN_PASSWORD) {
          candidates.push({
            id: 'admin_legacy',
            email: LEGACY_ADMIN_EMAIL,
            password: LEGACY_ADMIN_PASSWORD,
            role: 'admin',
            name: 'Restaurant Admin',
          });
        }

        // Super Admin
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
  cookies: {
    sessionToken: {
      name: process.env.NEXTAUTH_COOKIE_NAME || 'session_ordering',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      const typedToken = token as TokenWithRole;
      const typedUser = user as AdminUser & { tenantSlug?: string } | undefined;
      if (typedUser?.role) {
        typedToken.role = typedUser.role;
      }
      if (typedUser?.tenantSlug) {
        typedToken.tenantSlug = typedUser.tenantSlug;
      }
      return typedToken;
    },
    async session({ session, token }) {
      const typedSession = session as SessionWithRole;
      const typedToken = token as TokenWithRole;
      if (typedToken?.role) {
        typedSession.user.role = typedToken.role;
      }
      if (typedToken?.tenantSlug) {
        typedSession.user.tenantSlug = typedToken.tenantSlug;
      }
      return typedSession;
    },
  },
};
