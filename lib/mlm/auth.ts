import bcrypt from 'bcryptjs';
import prisma from '../prisma';

export interface AssociateAuthResult {
  success: boolean;
  associate?: {
    id: string;
    name: string;
    email: string;
    referralCode: string;
    level: number;
    totalEarnings: number;
    monthlyEarnings: number;
  };
  error?: string;
}

export async function authenticateAssociate(
  email: string,
  password: string
): Promise<AssociateAuthResult> {
  try {
    const associate = await prisma.associate.findUnique({
      where: { email },
    });

    if (!associate) {
      return { success: false, error: 'Invalid email or password' };
    }

    if (associate.status !== 'ACTIVE') {
      return { success: false, error: 'Account is inactive or suspended' };
    }

    const isValid = await bcrypt.compare(password, associate.password);
    if (!isValid) {
      return { success: false, error: 'Invalid email or password' };
    }

    const { password: _, ...associateWithoutPassword } = associate;
    return {
      success: true,
      associate: {
        id: associateWithoutPassword.id,
        name: associateWithoutPassword.name,
        email: associateWithoutPassword.email,
        referralCode: associateWithoutPassword.referralCode,
        level: associateWithoutPassword.level,
        totalEarnings: associateWithoutPassword.totalEarnings,
        monthlyEarnings: associateWithoutPassword.monthlyEarnings,
      },
    };
  } catch (error: any) {
    console.error('Associate authentication error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

