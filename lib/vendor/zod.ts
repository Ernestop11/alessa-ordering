type Check = (value: string) => string | null;

interface SafeParseSuccess<T> {
  success: true;
  data: T;
}

interface SafeParseError {
  success: false;
  error: Error;
}

class ZodString {
  private checks: Check[] = [];

  regex(pattern: RegExp, message = 'Invalid format') {
    this.checks.push((value) => (pattern.test(value) ? null : message));
    return this;
  }

  min(length: number, message = `Must be at least ${length} characters`) {
    this.checks.push((value) => (value.length >= length ? null : message));
    return this;
  }

  max(length: number, message = `Must be at most ${length} characters`) {
    this.checks.push((value) => (value.length <= length ? null : message));
    return this;
  }

  safeParse(value: unknown): SafeParseSuccess<string> | SafeParseError {
    if (typeof value !== 'string') {
      return { success: false, error: new Error('Value must be a string') };
    }
    const normalized = value.trim();
    for (const check of this.checks) {
      const result = check(normalized);
      if (result) {
        return { success: false, error: new Error(result) };
      }
    }
    return { success: true, data: normalized };
  }
}

export const z = {
  string: () => new ZodString(),
};

export type { SafeParseError, SafeParseSuccess };
