import { NextResponse } from 'next/server';
import type { ZodSchema, ZodTypeAny } from 'zod';

type ValidationSuccess<T> = {
  success: true;
  data: T;
};

type ValidationFailure = {
  success: false;
  response: NextResponse;
};

export async function validateRequestBody<T extends ZodTypeAny>(
  req: Request,
  schema: ZodSchema<T>
): Promise<ValidationSuccess<T['_output']> | ValidationFailure> {
  let payload: unknown;

  try {
    payload = await req.json();
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      ),
    };
  }

  const result = schema.safeParse(payload);

  if (!result.success) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Invalid request body',
          details: result.error.flatten(),
        },
        { status: 400 }
      ),
    };
  }

  return {
    success: true,
    data: result.data,
  };
}
