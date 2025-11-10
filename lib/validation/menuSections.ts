import { z } from 'zod';

export const menuSectionCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120, 'Name must be 120 characters or less'),
  description: z
    .string()
    .max(500)
    .optional()
    .or(z.literal(''))
    .transform((value) => (value === '' ? undefined : value)),
  type: z.string().min(1, 'Type is required'),
  hero: z.boolean().optional(),
});

const positionSchema = z.preprocess((value) => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return Number(value);
  }
  return value;
}, z.number().int({ message: 'Position must be an integer' }));

export const menuSectionUpdateSchema = z
  .object({
    id: z.string().min(1, 'Section id is required'),
    name: z.string().min(1).max(120).optional(),
    description: z
      .string()
      .max(500)
      .optional()
      .or(z.literal(''))
      .transform((value) => (value === '' ? undefined : value))
      .optional(),
    type: z.string().min(1).optional(),
    hero: z.boolean().optional(),
    position: positionSchema.optional(),
  })
  .partial({ name: true, description: true, type: true, hero: true, position: true });

export const menuSectionReorderSchema = z.object({
  order: z.array(z.string().min(1)).min(1, 'Order must contain at least one section id'),
});
