import { z } from 'zod';

const stringOrNumberToNumber = z.preprocess((value) => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return Number(value);
  }
  if (typeof value === 'number') {
    return value;
  }
  return value;
}, z.number({ invalid_type_error: 'Price must be a number' }));

const optionalString = z
  .string()
  .max(500)
  .transform((val) => val.trim())
  .optional()
  .or(z.literal(''))
  .transform((val) => (val === '' ? undefined : val));

export const menuItemCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120, 'Name must be 120 characters or less'),
  description: optionalString.optional(),
  price: stringOrNumberToNumber
    .refine((value) => Number.isFinite(value), { message: 'Price must be a valid number' })
    .refine((value) => value >= 0, { message: 'Price must be greater than or equal to zero' }),
  category: z
    .string()
    .min(1, 'Category is required')
    .max(60, 'Category must be 60 characters or less')
    .transform((val) => val.trim()),
  image: z
    .string()
    .max(500)
    .trim()
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)),
  gallery: z.array(z.string().min(1)).optional(),
  available: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  tags: z.array(z.string().min(1)).optional(),
  menuSectionId: z
    .string()
    .min(1)
    .trim()
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)),
});

export const menuItemUpdateSchema = menuItemCreateSchema.partial();
