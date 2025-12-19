import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/options'
import prisma from '@/lib/prisma'
import TemplateBuilderList from '@/components/super/TemplateBuilder/TemplateBuilderList'

export const dynamic = 'force-dynamic'

export default async function TemplateBuilderPage() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string } | undefined)?.role

  if (!session || role !== 'super_admin') {
    redirect('/admin/login')
  }

  // Fetch all templates
  const templates = await prisma.tenantTemplate.findMany({
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      _count: {
        select: {
          blocks: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Fetch all tenants for creating new templates
  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
    },
    orderBy: { name: 'asc' },
  })

  return <TemplateBuilderList initialTemplates={templates} tenants={tenants} />
}

