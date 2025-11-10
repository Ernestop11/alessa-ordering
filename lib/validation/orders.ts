import { z } from 'zod';

const orderStatusEnum = z.enum([
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'completed',
  'cancelled',
]);

export const orderStatusUpdateSchema = z.object({
  orderId: z.string().min(1, 'orderId is required'),
  status: z
    .string()
    .min(1, 'status is required')
    .transform((value) => value.toLowerCase())
    .pipe(orderStatusEnum),
});
