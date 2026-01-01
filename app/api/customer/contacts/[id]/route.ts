import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCustomerFromRequest } from '@/lib/customer-auth';

// PUT - Update a contact
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customer = await getCustomerFromRequest(request);
    if (!customer) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify contact belongs to this customer
    const existingContact = await prisma.customerContact.findFirst({
      where: {
        id,
        customerId: customer.id,
      },
    });

    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
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

    // Check if email is being changed to one that already exists
    if (email.trim().toLowerCase() !== existingContact.email) {
      const duplicateContact = await prisma.customerContact.findUnique({
        where: {
          customerId_email: {
            customerId: customer.id,
            email: email.trim().toLowerCase(),
          },
        },
      });

      if (duplicateContact) {
        return NextResponse.json(
          { error: 'A contact with this email already exists' },
          { status: 409 }
        );
      }
    }

    const contact = await prisma.customerContact.update({
      where: { id },
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
      },
    });

    return NextResponse.json({
      contact,
      message: 'Contact updated successfully',
    });
  } catch (error) {
    console.error('[contacts] Error updating contact:', error);
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customer = await getCustomerFromRequest(request);
    if (!customer) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify contact belongs to this customer
    const existingContact = await prisma.customerContact.findFirst({
      where: {
        id,
        customerId: customer.id,
      },
    });

    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    await prisma.customerContact.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Contact deleted successfully',
    });
  } catch (error) {
    console.error('[contacts] Error deleting contact:', error);
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    );
  }
}
