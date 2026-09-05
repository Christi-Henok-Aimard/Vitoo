export const normalizePaymentMethods = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((m): m is string => typeof m === 'string');
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? parsed.filter((m): m is string => typeof m === 'string') : [];
    } catch {
      return value.split(',').map((m) => m.trim()).filter(Boolean);
    }
  }
  return [];
};