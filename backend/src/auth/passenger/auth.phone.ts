export const normalizePhone = (raw: string): string => {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.startsWith('225') && digits.length > 10) return digits.slice(3);
  if (digits.startsWith('00225') && digits.length > 12) return digits.slice(5);
  return digits;
};

export const formatPhone = (raw: string): string => {
  const clean = normalizePhone(raw);
  if (clean.length === 10) return `${clean.slice(0, 2)} ${clean.slice(2, 4)} ${clean.slice(4, 6)} ${clean.slice(6, 8)} ${clean.slice(8)}`;
  return clean;
};
