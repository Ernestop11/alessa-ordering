export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // This layout intentionally doesn't enforce authentication so that
  // the login page (app/admin/login) can render without redirect loops.
  // Protection is applied at the admin index page (app/admin/page.tsx).
  return <>{children}</>;
}