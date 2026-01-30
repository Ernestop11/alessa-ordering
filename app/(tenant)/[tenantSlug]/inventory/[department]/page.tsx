'use client';

import { useParams } from 'next/navigation';
import DepartmentView from '@/components/inventory/DepartmentView';

export default function DepartmentPage() {
  const params = useParams();
  const tenantSlug = params?.tenantSlug as string;
  const departmentId = params?.department as string;

  return <DepartmentView tenantSlug={tenantSlug} departmentId={departmentId} />;
}
