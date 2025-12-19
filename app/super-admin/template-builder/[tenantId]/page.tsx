import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/options'
import prisma from '@/lib/prisma'
import TemplateBuilder from '@/components/super/TemplateBuilder'

export const dynamic = 'force-dynamic'

export default async function TemplateBuilderTenantPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantId: string }> | { tenantId: string }
  searchParams?: Promise<{ templateId?: string }> | { templateId?: string }
}) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string } | undefined)?.role

  if (!session || role !== 'super_admin') {
    redirect('/admin/login')
  }

  const { tenantId } = await Promise.resolve(params)
  const resolvedSearchParams = await Promise.resolve(searchParams || {})
  const templateId = resolvedSearchParams.templateId

  // If templateId is provided, fetch by ID (for global templates)
  // Otherwise, fetch by tenantId (for tenant-specific templates)
  let template
  if (templateId) {
    template = await prisma.tenantTemplate.findUnique({
      where: { id: templateId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        blocks: {
          orderBy: { position: 'asc' },
          include: {
            menuItems: {
              include: {
                menuItem: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    image: true,
                    description: true,
                  },
                },
              },
              orderBy: { displayOrder: 'asc' },
            },
          },
        },
        settings: true,
      },
    })
  } else if (tenantId === 'global') {
    // For global templates without templateId, redirect to template list
    redirect('/super-admin/template-builder')
  } else {
    template = await prisma.tenantTemplate.findUnique({
      where: { tenantId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        blocks: {
          orderBy: { position: 'asc' },
          include: {
            menuItems: {
              include: {
                menuItem: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    image: true,
                    description: true,
                  },
                },
              },
              orderBy: { displayOrder: 'asc' },
            },
          },
        },
        settings: true,
      },
    })
  }

  if (!template) {
    redirect('/super-admin/template-builder')
  }

  // Fetch tenant's menu items for the picker
  // For global templates, fetch all menu items or none
  const tenant = template.tenant
    ? await prisma.tenant.findUnique({
        where: { id: template.tenant.id },
        select: { id: true, slug: true },
      })
    : null

  const menuItems = tenant
    ? await prisma.menuItem.findMany({
        where: { tenantId: tenant.id },
        select: {
          id: true,
          name: true,
          price: true,
          image: true,
          description: true,
        },
        orderBy: { name: 'asc' },
        take: 500,
      })
    : []

  return (
    <TemplateBuilder
      template={template}
      tenantSlug={template.tenant?.slug || 'global'}
      menuItems={menuItems}
    />
  )
}

