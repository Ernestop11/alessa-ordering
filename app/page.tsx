import { headers } from 'next/headers';
import LandingPage from '@/components/LandingPage';
import { Providers } from './providers';

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'alessacloud.com';

export default async function Home() {
  const headersList = headers();
  const hostHeader = headersList.get('host') || '';
  const hostname = hostHeader.split(':')[0];

  // Show landing page on root domain, redirect to order page for tenant subdomains
  if (hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}` || hostname === 'localhost') {
    return (
      <Providers>
        <LandingPage />
      </Providers>
    );
  }

  // For tenant subdomains, redirect to order page
  const { redirect } = await import('next/navigation');
  redirect('/order');
}