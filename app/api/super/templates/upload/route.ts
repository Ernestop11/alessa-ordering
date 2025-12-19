import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'logo' or 'favicon'
    const templateId = formData.get('templateId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
    }

    // Validate file type
    const validMimeTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/svg+xml',
      'image/x-icon',
      'image/vnd.microsoft.icon',
    ]

    if (!validMimeTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 2MB)' }, { status: 400 })
    }

    // Get template to find tenant slug
    const template = await prisma.tenantTemplate.findUnique({
      where: { id: templateId },
      include: { tenant: true },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Determine directory based on tenant or global
    const tenantSlug = template.tenant?.slug || 'global'
    const uploadDir = path.join(process.cwd(), 'public', 'tenant', tenantSlug, 'branding')

    // Create directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate filename
    const ext = file.name.split('.').pop() || 'png'
    const filename = `${type}-${Date.now()}.${ext}`
    const filepath = path.join(uploadDir, filename)

    // Write file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Generate public URL
    const url = `/tenant/${tenantSlug}/branding/${filename}`

    // Update template settings
    await prisma.tenantTemplateSettings.upsert({
      where: { templateId },
      create: {
        templateId,
        ...(type === 'logo' ? { logoUrl: url } : { faviconUrl: url }),
      },
      update: {
        ...(type === 'logo' ? { logoUrl: url } : { faviconUrl: url }),
      },
    })

    return NextResponse.json({
      success: true,
      url,
      filename,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}
