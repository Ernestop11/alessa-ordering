'use client';

import { useParams } from 'next/navigation';
import POSLayout from '@/components/pos/POSLayout';

export default function POSPage() {
  const params = useParams();
  const tenantSlug = params?.tenantSlug as string;

  return <POSLayout tenantSlug={tenantSlug} />;
}
