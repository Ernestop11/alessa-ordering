import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTenantSlugFromHeaders, getTenantBySlug } from '@/lib/tenant';
import { getCustomerFromRequest } from '@/lib/customer-auth';

// GET - List all contacts for logged-in customer
export async function GET(request: NextRequest) {
  try {
    const customer = await getCustomerFromRequest(request);
    if (!customer) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const contacts = await prisma.customerContact.findMany({
      where: {
        customerId: customer.id,
      },
      orderBy: [
        { name: 'asc' },
      ],
    });

    return NextResponse.json({
      contacts,
      count: contacts.length,
    });
  } catch (error) {
    console.error('[contacts] Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

// POST - Create a new contact
export async function POST(request: NextRequest) {
  try {
    const customer = await getCustomerFromRequest(request);
    if (!customer) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email, phone } = body;

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if contact already exists for this customer
    const existingContact = await prisma.customerContact.findUnique({
      where: {
        customerId_email: {
          customerId: customer.id,
          email: email.trim().toLowerCase(),
        },
      },
    });

    if (existingContact) {
      return NextResponse.json(
        { error: 'A contact with this email already exists' },
        { status: 409 }
      );
    }

    const contact = await prisma.customerContact.create({
      data: {
        customerId: customer.id,
        tenantId: customer.tenantId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
      },
    });

    return NextResponse.json({
      contact,
      message: 'Contact created successfully',
    });
  } catch (error) {
    console.error('[contacts] Error creating contact:', error);
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    );
  }
}
